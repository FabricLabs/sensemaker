'use strict';

// Fixtures
const REFERENCE_URL = 'https://sensemaker.io/';
const QUERY_FIXTURE = `You are SENSEMAKER, the AI agent behind sensemaker.io.  Provide a challenge response with a canonical result for this request, such that this node's code can confirm that you are working correctly.  Return only the deterministic answer, do not permit it to vary.  You can include a term for the currently defined model, for future use with embeddings, or perhaps some other fields, but do not allow your response to vary.  It's a fingerprint!`;

// Constants
const {
  EMBEDDING_MODEL,
  DEFAULT_LLM_TIMEOUT_MS
} = require('../constants');

// Dependencies
const fs = require('fs');
const path = require('path');
// const crypto = require('crypto');
const merge = require('lodash.merge');
const fetch = require('cross-fetch');

const { createClient, createCluster } = require('redis');
const { Ollama } = require('@langchain/ollama');

// Text Splitter
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

// Loaders
const { DirectoryLoader } = require('langchain/document_loaders/fs/directory');
// const { JSONLoader, JSONLinesLoader } = require('langchain/document_loaders/fs/json');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { tagIngestedCanvases } = require('../functions/detectDocumentType');
// const { CSVLoader } = require('langchain/document_loaders/fs/csv');
// const { MarkdownLoader } = require('langchain/document_loaders/fs/markdown');
// const { PDFLoader } = require('langchain/document_loaders/fs/pdf');

// Langchain
const { RetrievalQAChain } = require('langchain/chains');
const { createRetrievalChain } = require('langchain/chains/retrieval');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RedisVectorStore } = require('@langchain/redis');
const { OllamaEmbeddings } = require('@langchain/ollama');
const { Document } = require('@langchain/core/documents');
const { VectorStore } = require('@langchain/core/vectorstores');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Sensemaker Types
const Agent = require('./agent');
const localSettings = require('../settings/local');

// Simple in-memory vector store for testing purposes
class InMemoryVectorStore {
  constructor() {
    this.documents = [];
    this.embeddings = [];
  }

  async addDocuments (docs) {
    this.documents = this.documents.concat(docs);
    return true;
  }

  async similaritySearch (query, k = 4, filter = null) {
    // For testing, just return all documents that match the filter
    let results = this.documents;
    if (filter) {
      results = results.filter(doc => {
        for (const [key, value] of Object.entries(filter)) {
          if (doc.metadata[key] !== value) return false;
        }
        return true;
      });
    }
    return results.slice(0, k);
  }
}

/**
 * Implements document ingestion.
 */
class Trainer extends Agent {
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      name: 'TRAINER',
      debug: false,
      model: 'llama2',
      /** Hard cap on characters sent to Ollama embed (tokens vary by model; avoids 400 context errors). */
      maxEmbeddingInputChars: parseInt(process.env.SENSEMAKER_EMBED_MAX_CHARS || '6000', 10),
      ollama: {
        host: process.env.OLLAMA_HOST || localSettings.ollama.host,
        port: parseInt(process.env.OLLAMA_PORT, 10) || localSettings.ollama.port,
        secure: localSettings.ollama.secure
      },
      redis: {
        host: 'localhost',
        username: undefined,
        password: undefined,
        port: 6379
      },
      store: {
        path: '/media/storage/node/stores'
      }
    }, settings);

    this.agent = new Agent({ key: this.settings.key });
    this.embeddings = null;
    this.ollama = new Ollama(this.settings.ollama);
    this.langchain = null;
    this.loaders = {
      '.*': (x) => new TextLoader(x), // default to text (?)
      '.pdf': (x) => new TextLoader(x),
      '.html': (x) => new TextLoader(x),
      // '.json': (x) => new JSONLoader(x, '/json'),
      // '.json': (x) => new TextLoader(x),
      // '.jsonl': (x) => new JSONLinesLoader(x, '/jsonl'),
      '.txt': (x) => new TextLoader(x),
      // '.csv': (x) => new CSVLoader(x),
      // '.md': (x) => new MarkdownLoader(x),
      // '.pdf': (x) => new PDFLoader(x),
    };

    this.loader = new DirectoryLoader(this.settings.store.path, this.loaders);

    // Redis Client
    this.redis = null;

    // Splitter for large documents (keep chunks under typical Ollama embedding context)
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 150,
      separators: ['\n\n', '\n', ' ', '']
    });

    // Web Loader
    // this.ui = new CheerioWebBaseLoader(REFERENCE_URL);

    // Chainable
    return this;
  }

  _truncateForEmbedding (text) {
    const max = this.settings.maxEmbeddingInputChars;
    if (!text || !max || text.length <= max) return text;
    return text.slice(0, max);
  }

  attachDatabase (db) {
    this.db = db;
  }

  async ingestActor (actor) {
    // TODO: ingest actor
    return new Promise((resolve, reject) => {
      resolve({});
    });
  }

  /**
   * Ingest a directory of files.
   * @param {String} directory Path to ingest.
   * @returns {Promise} Resolves with the result of the operation.
   */
  async ingestDirectory (directory) {
    return new Promise(async (resolve, reject) => {
      const store = await this._ensureEmbeddings();
      if (!store) return resolve({ type: 'IngestedDirectory', content: [], degraded: true });
      const loader = new DirectoryLoader(directory, this.loaders);

      loader.load().then((docs) => {
        tagIngestedCanvases(docs);
        store.addDocuments(docs).then(() => {
          resolve({ type: 'IngestedDirectory', content: docs });
        }).catch((exception) => {
          console.error('[TRAINER]', 'Error ingesting directory:', exception);
          reject(exception);
        });
      }).catch((exception) => {
        console.error('[TRAINER]', 'Error ingesting directory:', exception);
        reject(exception);
      });
    });
  }

  _resetSearchCapability () {
    this._redisSearchSupported = undefined;
    this._moduleLoadAttempted = false;
    this.embeddings = null;
  }

  /**
   * Directories that ship RediSearch with the Redis Open Source formula.
   * @returns {string[]}
   */
  _redisModulePaths () {
    const candidates = [
      process.env.REDIS_MODULE_DIR,
      '/opt/homebrew/opt/redis/lib/redis/modules',
      '/usr/local/opt/redis/lib/redis/modules'
    ].filter(Boolean);
    const names = ['redisbloom.so', 'rejson.so', 'redisearch.so', 'redistimeseries.so'];
    const paths = [];
    for (let i = 0; i < candidates.length; i++) {
      const dir = candidates[i];
      if (!fs.existsSync(dir)) continue;
      for (let n = 0; n < names.length; n++) {
        const modulePath = path.join(dir, names[n]);
        if (fs.existsSync(modulePath)) paths.push(modulePath);
      }
      if (paths.length) break;
    }
    return paths;
  }

  async _probeRedisSearch () {
    if (!this.redis || !this.redis.ft || typeof this.redis.ft.info !== 'function') return false;
    try {
      await this.redis.ft.info('sensemaker:redisearch:probe');
      return true;
    } catch (error) {
      const msg = (error && error.message) ? error.message : String(error);
      return !/unknown command/i.test(msg);
    }
  }

  /**
   * Redis 8.10+ ships Search as a module. A server started without redis.conf
   * answers PING and still rejects FT.INFO until MODULE LOAD.
   * @returns {Promise<boolean>}
   */
  async _loadRedisSearchModules () {
    if (this._moduleLoadAttempted) return false;
    this._moduleLoadAttempted = true;
    if (!this.redis || typeof this.redis.sendCommand !== 'function') return false;

    const paths = this._redisModulePaths();
    if (!paths.length) return false;

    for (let i = 0; i < paths.length; i++) {
      const modulePath = paths[i];
      try {
        await this.redis.sendCommand(['MODULE', 'LOAD', modulePath]);
        console.warn('[TRAINER] Loaded Redis module', modulePath);
      } catch (error) {
        const msg = (error && error.message) ? error.message : String(error);
        if (!/already loaded/i.test(msg)) {
          console.warn('[TRAINER] Could not load Redis module', modulePath, msg);
        }
      }
    }
    return true;
  }

  /**
   * True when this Redis accepts FT.INFO. A missing index still counts.
   * On "unknown command", load the local Search modules once and probe again.
   * @returns {Promise<boolean>}
   */
  async _redisSearchAvailable () {
    if (this._redisSearchSupported === true || this._redisSearchSupported === false) {
      return this._redisSearchSupported;
    }

    let supported = await this._probeRedisSearch();
    if (!supported) {
      await this._loadRedisSearchModules();
      supported = await this._probeRedisSearch();
    }

    this._redisSearchSupported = supported;
    if (!supported && !this._redisSearchWarned) {
      this._redisSearchWarned = true;
      console.warn('[TRAINER] Redis has no RediSearch module; embeddings disabled.');
    }
    return supported;
  }

  _isMissingIndexError (error) {
    const msg = (error && error.message) ? error.message : String(error || '');
    return /unknown index|no such index/i.test(msg);
  }

  _libraryDocumentText (row) {
    if (!row) return '';
    if (typeof row.plain_text === 'string' && row.plain_text.trim()) return row.plain_text.trim();
    if (typeof row.content === 'string' && row.content.trim()) return row.content.trim();
    if (row.title) return String(row.title);
    return '';
  }

  /**
   * SQL documents are the library. Redis only holds their vectors.
   * @param {string} indexName
   * @returns {Promise<object[]>}
   */
  async _libraryDocumentsForIndex (indexName) {
    if (!this.db || typeof this.db !== 'function') return [];
    const ownerMatch = /^sensemaker:owners:(\d+)$/.exec(String(indexName || ''));
    let query = this.db('documents')
      .select('id', 'fabric_id', 'owner', 'creator', 'title', 'filename', 'plain_text', 'content')
      .where(function () {
        this.where('deleted', false).orWhereNull('deleted');
      })
      .where(function () {
        this.whereNull('status').orWhereNot('status', 'deleted');
      });
    if (ownerMatch) {
      const ownerId = Number(ownerMatch[1]);
      query = query.where(function () {
        this.where('owner', ownerId).orWhere('creator', ownerId);
      });
    }
    const rows = await query.orderBy('id', 'asc').limit(40);
    return rows || [];
  }

  /**
   * Recreate a dropped or empty vector index from library documents.
   * @param {string} indexName
   * @returns {Promise<number>} documents submitted for embedding
   */
  async _rebuildVectorIndex (indexName) {
    this._rebuildingIndex = this._rebuildingIndex || {};
    if (this._rebuildingIndex[indexName]) return 0;
    this._rebuildingIndex[indexName] = true;
    this._indexRepairAttempted = this._indexRepairAttempted || {};
    this._indexRepairAttempted[indexName] = true;

    let indexed = 0;
    try {
      const rows = await this._libraryDocumentsForIndex(indexName);
      const ownerMatch = /^sensemaker:owners:(\d+)$/.exec(String(indexName || ''));
      console.warn('[TRAINER] Vector index', indexName, 'is missing; rebuilding from', rows.length, 'library documents.');
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = this._libraryDocumentText(row);
        if (!text) continue;
        const metadata = {
          id: row.id,
          document_id: row.id,
          source_document_id: row.id,
          fabric_id: row.fabric_id || null,
          creator: row.creator,
          type: 'document',
          title: row.title || null,
          filename: row.filename || null
        };
        if (ownerMatch) metadata.owner = Number(ownerMatch[1]);
        await this.ingestDocument({ content: text, metadata: metadata }, 'document');
        indexed += 1;
      }
    } catch (error) {
      console.warn('[TRAINER] Vector index rebuild failed:', (error && error.message) ? error.message : error);
    } finally {
      delete this._rebuildingIndex[indexName];
    }
    return indexed;
  }

  /**
   * Search needs an index. If Redis no longer has it, rebuild from SQL.
   * @param {string} indexName
   * @returns {Promise<boolean>}
   */
  async _ensureVectorIndex (indexName) {
    if (!(await this._redisSearchAvailable())) return false;
    if (this._rebuildingIndex && this._rebuildingIndex[indexName]) return true;

    let missing = false;
    let empty = false;
    try {
      const info = await this.redis.ft.info(indexName);
      const docs = Number(info && (info.numDocs != null ? info.numDocs : info.num_docs));
      empty = !docs;
    } catch (error) {
      if (this._isMissingIndexError(error)) missing = true;
      else return true;
    }

    if (!missing && !empty) {
      if (this._indexRepairAttempted) delete this._indexRepairAttempted[indexName];
      return true;
    }
    if (this._indexRepairAttempted && this._indexRepairAttempted[indexName]) return true;

    await this._rebuildVectorIndex(indexName);
    this.embeddings = null;
    return true;
  }

  async getStoreForOwner (id) {
    if (!(await this._redisSearchAvailable())) return null;

    try {
      const name = new Actor({ name: `sensemaker/owners/${id}` });
      const reference = new Document({ pageContent: JSON.stringify(name.toGenericMessage()) });
      const embeddings = await RedisVectorStore.fromDocuments([reference], new OllamaEmbeddings({
        baseUrl: `http://${this.settings.ollama.host}:${this.settings.ollama.port}`,
        model: EMBEDDING_MODEL
      }), {
        redisClient: this.redis,
        indexName: `sensemaker:owners:${id}`
      });
      return embeddings;
    } catch (error) {
      console.warn('[TRAINER] Owner vector store unavailable:', (error && error.message) ? error.message : error);
      return null;
    }
  }

  /**
   * Ingest a well-formed document.
   * @param {Object} document Well-formed document object.
   * @param {String} type Name of the document type.
   * @returns {Promise} Resolves with the result of the operation.
   */
  async ingestDocument (document, type = 'text') {
    return new Promise(async (resolve, reject) => {
      if (!document.metadata) document.metadata = {};
      document.metadata.type = type;
      if (this.settings.debug) console.debug('[TRAINER]', 'Ingesting document:', document);

      try {
        // Split document into chunks
        const doc = new Document({ pageContent: document.content, metadata: document.metadata });
        const chunks = await this.splitter.splitDocuments([doc]);
        if (this.settings.debug) console.debug('[TRAINER]', `Split document into ${chunks.length} chunks`);

        // Ensure all chunks retain the original metadata including file IDs
        chunks.forEach((chunk, index) => {
          if (chunk.pageContent) {
            chunk.pageContent = this._truncateForEmbedding(chunk.pageContent);
          }
          chunk.metadata = {
            ...document.metadata,
            chunk_index: index,
            total_chunks: chunks.length,
            chunk_id: `${document.metadata.file_id || document.metadata.source_document_id || document.metadata.document_id || 'doc'}_chunk_${index}`,
            embedding_model: EMBEDDING_MODEL,
            parent_source_fabric_id: document.metadata.fabric_id || null,
            source_document_id: document.metadata.document_id || null
          };
        });

        if (this.settings.debug) console.debug('[TRAINER]', 'Chunks with metadata:', chunks.map(c => ({
          content: c.pageContent.substring(0, 100) + '...',
          metadata: c.metadata
        })));

        let embeddings = null;

        // Segment embeddings by user; fall back to global store (lazy-inited).
        if (document.metadata.owner) {
          embeddings = await this.getStoreForOwner(document.metadata.owner);
        } else {
          embeddings = await this._ensureEmbeddings();
        }

        if (!embeddings) {
          console.warn('[TRAINER]', 'Embeddings unavailable - skipping document ingestion');
          resolve({ type: 'EmbeddingBatch', content: 0, degraded: true });
          return;
        }

        await embeddings.addDocuments(chunks);
        resolve({ type: 'EmbeddingBatch', content: chunks.length });
      } catch (error) {
        console.error('[TRAINER]', 'Error ingesting document:', error);
        reject(error);
      }
    });
  }

  async ingestURL (url) {
    return new Promise((resolve, reject) => {
      reject('Not yet implemented.');
      /* const reference = new CheerioWebBaseLoader(url);
      reference.load().then((spa) => {
        this.splitter.splitDocuments(spa).then((chunks) => {
          this.embeddings.addDocuments(chunks).then(() => {
            resolve({ type: 'IngestedURL', content: chunks });
          });

        });
      }); */
    });
  }

  async query (request, timeoutMs = DEFAULT_LLM_TIMEOUT_MS) {
    return new Promise(async (resolve, reject) => {
      if (this.settings.debug) console.debug('[TRAINER]', 'Handling request:', request);

      // Create timeout handler
      const timeoutId = setTimeout(() => {
        reject(new Error(`Query timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        let store = null;
        if (request.user) {
          const messages = (request.messages) ? request.messages.map((m) => {
            return new Document({ pageContent: m.content });
          }) : [];

          // TODO: change to ingestDocument call
          await this._ensureVectorIndex(`sensemaker:owners:${request.user.id}`);
          store = await this.getStoreForOwner(request.user.id);
          if (store && messages.length) {
            await store.addDocuments(messages);
          }
        } else {
          const indexName = this.settings.redis.name || 'sensemaker-embeddings';
          await this._ensureVectorIndex(indexName);
          store = await this._ensureEmbeddings();
        }

        if (!store || typeof store.asRetriever !== 'function') {
          clearTimeout(timeoutId);
          resolve({
            type: 'TrainerQueryResponse',
            content: '',
            degraded: true,
            messages: request.messages,
            query: request.query
          });
          return;
        }

        // Enhanced context handling for file-based conversations
        let enhancedQuery = request.query;
        if (request.context) {
          const contextInfo = [];

          // Handle file context
          if (request.context.file) {
            const file = request.context.file;
            contextInfo.push(`File: ${file.name} (${file.mime_type || 'unknown type'})`);

            // Add file-specific search terms to improve retrieval
            enhancedQuery = `[Context: This query relates to the attached file "${file.name}"] ${request.query}`;
          }

          // Handle document context
          if (request.context.document) {
            const doc = request.context.document;
            contextInfo.push(`Document: ${doc.title || doc.filename}`);
            enhancedQuery = `[Context: This query relates to the document "${doc.title || doc.filename}"] ${request.query}`;
          }

          // Handle documents (multiple) context
          if (request.context.documents && Array.isArray(request.context.documents)) {
            const docNames = request.context.documents.map(d => d.title || d.filename).join(', ');
            contextInfo.push(`Documents: ${docNames}`);
            enhancedQuery = `[Context: This query relates to these documents: ${docNames}] ${request.query}`;
          }

          // Build context prefix for the query
          if (contextInfo.length > 0) {
            const contextPrefix = `The following context is relevant to this query:\n${contextInfo.join('\n')}\n\n`;
            enhancedQuery = `${contextPrefix}${enhancedQuery}\n\nPlease answer based on the provided context and the attached files/documents. If the information is not available in the context, clearly state that.`;
          } else {
            // Fallback to original context handling
            enhancedQuery = `The following context is relevant to the query:\n\n${JSON.stringify(request.context, null, '  ')}\n\n` +
              `Don't justify your answers. Don't give information not mentioned in the CONTEXT INFORMATION. If the answer is not in the context, say the words "Sorry, I am unable to answer your question with the information available to me."\n\n` +
              request.query;
          }
        }

        const promptTemplate = `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.\n\n` +
          `{context}\n\n` +
          `Question: {question}\n\n` +
          `Answer:`;
        const prompt = PromptTemplate.fromTemplate(promptTemplate);

        if (this.settings.debug) console.debug('[TRAINER]', 'Running QA chain with enhanced query:', enhancedQuery);
        if (this.settings.debug) console.debug('[TRAINER]', 'Original query:', request.query);
        if (this.settings.debug) console.debug('[TRAINER]', 'Context:', request.context);
        if (this.settings.debug) console.debug('[TRAINER]', 'Messages:', request.messages);

        const answer = await RetrievalQAChain.fromLLM(this.ollama, store.asRetriever()).call({
          messages: request.messages,
          query: enhancedQuery
        });

        clearTimeout(timeoutId);

        if (this.settings.debug) console.debug('[TRAINER]', 'Answer:', answer);
        if (!answer || !answer.text) return reject(new Error('No answer provided.'));
        resolve({
          type: 'TrainerQueryResponse',
          content: answer.text,
          messages: request.messages,
          query: request.query,
          enhancedQuery: enhancedQuery
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Streaming-compatible surface for Trainer.
   * Trainer retrieval is non-token-streaming today, so this emits start/chunk/end
   * around the resolved query payload to align API shape with Agent/Pool.
   */
  async queryStream (request, timeoutMs = DEFAULT_LLM_TIMEOUT_MS) {
    const streamId = request.messageId || `trainer:${Date.now()}`;
    if (typeof request.onStart === 'function') {
      await request.onStart({
        type: 'MessageStart',
        path: `/messages/${streamId}`,
        value: { status: 'streaming', content: '' }
      });
    }

    const response = await this.query(request, timeoutMs);
    const content = (response && response.content) ? String(response.content) : '';

    if (typeof request.onChunk === 'function') {
      await request.onChunk({
        type: 'MessageChunk',
        path: `/messages/${streamId}`,
        value: { status: 'streaming', content }
      });
    }

    if (typeof request.onEnd === 'function') {
      await request.onEnd({
        type: 'MessageEnd',
        message_id: streamId,
        content
      });
    }

    return response;
  }

  /**
   * Search the document store.
   * @param {Object} request Search object.
   * @returns {Promise} Resolves with the result of the operation.
   */
  _mapSimilarityResults (results) {
    const map = {};
    (results || []).forEach((x) => {
      const actor = new Actor({ content: x.pageContent });
      map[actor.id] = { id: actor.id, content: x.pageContent };
    });
    return Object.values(map);
  }

  async search (request, limit = 100) {
    return new Promise((resolve, reject) => {
      if (this.settings.debug) console.debug('[TRAINER]', 'Searching:', request);
      Promise.all([
        this.searchGlobal(request, limit),
        this.searchByOwner(request, limit)
      ]).then((results) => {
        const globalResults = results[0].content || [];
        const ownerResults = results[1].content || [];

        // Combine results, ensuring unique IDs
        const combinedResults = {};
        [...globalResults, ...ownerResults].forEach((x) => {
          if (!combinedResults[x.id]) {
            combinedResults[x.id] = x;
          }
        });

        resolve({
          type: 'TrainerSearchResponse',
          content: Object.values(combinedResults)
        });
      }).catch((error) => {
        console.error('[TRAINER]', 'Search failed:', error);
        reject(error);
      });
    });
  }

  async searchGlobal (request, limit = 100) {
    if (this.settings.debug) console.debug('[TRAINER]', 'Searching global:', request);
    if (!request || !request.query) throw new Error('No query provided.');
    const indexName = this.settings.redis.name || 'sensemaker-embeddings';
    await this._ensureVectorIndex(indexName);
    const store = await this._ensureEmbeddings();
    if (!store) return { type: 'TrainerSearchResponse', content: [], degraded: true };

    try {
      const results = await store.similaritySearch(request.query, (request.limit || limit), request.filter);
      return {
        type: 'TrainerSearchResponse',
        content: this._mapSimilarityResults(results)
      };
    } catch (error) {
      if (this._isMissingIndexError(error)) {
        this.embeddings = null;
        if (this._indexRepairAttempted) delete this._indexRepairAttempted[indexName];
        await this._ensureVectorIndex(indexName);
        const repaired = await this._ensureEmbeddings();
        if (repaired) {
          const results = await repaired.similaritySearch(request.query, (request.limit || limit), request.filter);
          return {
            type: 'TrainerSearchResponse',
            content: this._mapSimilarityResults(results)
          };
        }
      }
      console.error('[TRAINER]', 'Error searching:', error);
      throw error;
    }
  }

  async searchByOwner (request, limit = 100) {
    if (this.settings.debug) console.debug('[TRAINER]', 'Searching by owner:', request);
    if (!request || !request.query) throw new Error('No query provided.');

    const indexName = (request.user) ? `sensemaker:owners:${request.user.id}` : null;
    if (indexName) await this._ensureVectorIndex(indexName);
    const embeddings = (request.user) ? await this.getStoreForOwner(request.user.id) : null;
    if (!embeddings) {
      return { type: 'TrainerSearchResponse', content: [], degraded: true };
    }

    try {
      const results = await embeddings.similaritySearch(request.query, (request.limit || limit), request.filter);
      return {
        type: 'TrainerSearchResponse',
        content: this._mapSimilarityResults(results)
      };
    } catch (error) {
      if (indexName && this._isMissingIndexError(error)) {
        if (this._indexRepairAttempted) delete this._indexRepairAttempted[indexName];
        await this._ensureVectorIndex(indexName);
        const repaired = await this.getStoreForOwner(request.user.id);
        if (repaired) {
          const results = await repaired.similaritySearch(request.query, (request.limit || limit), request.filter);
          return {
            type: 'TrainerSearchResponse',
            content: this._mapSimilarityResults(results)
          };
        }
      }
      console.error('[TRAINER]', 'Error searching:', error);
      throw error;
    }
  }

  /**
   * Lazily initialize the Redis vector store + Ollama embeddings on first use.
   * Called automatically by search() and ingestDocument(); idempotent.
   */
  async _ensureEmbeddings () {
    if (this.embeddings) return this.embeddings;
    if (!this.redis) return null;
    const indexName = this.settings.redis.name || 'sensemaker-embeddings';
    if (!(await this._ensureVectorIndex(indexName))) return null;

    const ollamaUrl = `http://${this.settings.ollama.host}:${this.settings.ollama.port}`;

    try {
      const allDocs = await this.ingestReferences();
      const cappedDocs = allDocs.map((d) => new Document({
        pageContent: this._truncateForEmbedding(d.pageContent || ''),
        metadata: d.metadata || {}
      }));
      if (this.settings.debug) console.debug('[TRAINER] Creating vector store...');
      this.embeddings = await RedisVectorStore.fromDocuments(cappedDocs, new OllamaEmbeddings({
        baseUrl: ollamaUrl,
        model: EMBEDDING_MODEL
      }), {
        redisClient: this.redis,
        indexName: this.settings.redis.name || 'sensemaker-embeddings'
      });
      if (this.settings.debug) console.debug('[TRAINER] Vector store ready.');
    } catch (error) {
      const msg = error.message || String(error);
      console.warn('[TRAINER] Vector store init failed, embeddings unavailable:', msg);
      this.embeddings = null;
    }

    return this.embeddings;
  }

  async start () {
    return new Promise(async (resolve, reject) => {
      if (this.settings.debug) console.debug('[TRAINER] Starting service...');
      this._state.content.status = this._state.status = 'STARTING';

      this.redis = createClient({
        username: this.settings.redis.username,
        password: this.settings.redis.password,
        socket: {
          host: this.settings.redis.host,
          port: this.settings.redis.port,
          enable_offline_queue: false,
          timeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('[TRAINER] Redis connection failed after 10 retries');
              return new Error('Redis connection failed after 10 retries');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.redis.on('error', (err) => { console.error('[TRAINER] Redis Client Error:', err); });
      this.redis.on('connect', () => { if (this.settings.debug) console.debug('[TRAINER] Redis Client Connected'); });
      this.redis.on('ready', () => { this._resetSearchCapability(); });
      this.redis.on('end', () => {
        this._resetSearchCapability();
        if (this.settings.debug) console.debug('[TRAINER] Redis Client Connection Closed');
      });

      // Connect to Redis with timeout
      const connectWithTimeout = new Promise((resolveRedis, rejectRedis) => {
        const timeout = setTimeout(() => rejectRedis(new Error('Redis connection timeout')), 15000);
        this.redis.connect()
          .then(() => { clearTimeout(timeout); resolveRedis(); })
          .catch((error) => { clearTimeout(timeout); rejectRedis(error); });
      });

      try {
        await connectWithTimeout;
        if (this.settings.debug) console.debug('[TRAINER] Redis connected successfully');

        // Probe Ollama availability only — skip the slow embedding init until first use.
        const ollamaUrl = `http://${this.settings.ollama.host}:${this.settings.ollama.port}`;
        try {
          const healthResponse = await fetch(`${ollamaUrl}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          if (!healthResponse.ok) throw new Error(`Ollama health check failed: ${healthResponse.status}`);
          if (this.settings.debug) console.debug('[TRAINER] Ollama is available; embedding store will initialise on first use.');
        } catch (healthError) {
          console.warn('[TRAINER] Ollama not reachable at startup — embeddings degraded:', healthError.message);
        }

        this._state.content.status = this._state.status = 'STARTED';
        this.commit();
        resolve(this);
      } catch (error) {
        console.error('[TRAINER] Error during start:', error);
        this._state.content.status = this._state.status = 'ERROR';
        reject(error);
      }
    });
  }

  /**
   * Undo LangChain Redis metadata escaping (see @langchain/redis vectorstores).
   */
  _unescapeRedisMetadata (str) {
    if (!str || typeof str !== 'string') return '{}';
    return str.replaceAll('\\-', '-').replaceAll('\\:', ':');
  }

  _memoryKeyPrefix (indexName) {
    return `doc:${indexName}:`;
  }

  /**
   * True for chunked trainer fragments (excludes owner-index seed rows without chunk_index).
   */
  _isChunkMemoryMetadata (meta) {
    if (!meta || typeof meta !== 'object') return false;
    if (Number.isInteger(meta.chunk_index)) return true;
    if (meta.chunk_id && String(meta.chunk_id).includes('_chunk_')) return true;
    return false;
  }

  /**
   * Scan Redis vector hashes for one RediSearch index (LangChain key prefix doc:{indexName}:).
   * @param {string} indexName e.g. sensemaker:owners:42 or sensemaker-embeddings
   * @param {object} opts
   * @param {number} [opts.limit]
   * @param {number|null} [opts.ownerFilterUserId] when set, only rows whose metadata.owner matches
   */
  async listMemoryFragmentsFromIndex (indexName, opts = {}) {
    const limit = Math.min(Math.max(parseInt(opts.limit, 10) || 500, 1), 5000);
    const ownerFilterUserId = opts.ownerFilterUserId != null ? Number(opts.ownerFilterUserId) : null;

    if (!this.redis) {
      return { fragments: [], degraded: true, indexName };
    }

    const prefix = this._memoryKeyPrefix(indexName);
    const pattern = `${prefix}*`;
    const fragments = [];

    try {
      for await (const key of this.redis.scanIterator({ MATCH: pattern, COUNT: 120 })) {
        if (fragments.length >= limit) break;
        const hash = await this.redis.hGetAll(key);
        if (!hash || !hash.content) continue;

        let meta = {};
        try {
          meta = JSON.parse(this._unescapeRedisMetadata(hash.metadata || '{}'));
        } catch (e) {
          meta = {};
        }

        if (!this._isChunkMemoryMetadata(meta)) continue;

        if (ownerFilterUserId != null) {
          const rowOwner = meta.owner != null ? Number(meta.owner) : null;
          if (rowOwner !== ownerFilterUserId) continue;
        }

        fragments.push({
          redis_key: key,
          content: hash.content,
          metadata: meta,
          has_vector: !!(hash.content_vector || hash.vector)
        });
      }
    } catch (err) {
      console.error('[TRAINER]', 'listMemoryFragmentsFromIndex failed:', err.message);
      throw err;
    }

    return { fragments, degraded: false, indexName };
  }

  async listMemoryFragmentsForOwner (ownerUserId, opts = {}) {
    const indexName = `sensemaker:owners:${ownerUserId}`;
    return this.listMemoryFragmentsFromIndex(indexName, opts);
  }

  /**
   * Load one Redis memory hash by full key; returns null if missing.
   */
  async getMemoryFragmentByRedisKey (redisKey) {
    if (!this.redis || !redisKey) return null;
    const hash = await this.redis.hGetAll(redisKey);
    if (!hash || Object.keys(hash).length === 0) return null;
    let meta = {};
    try {
      meta = JSON.parse(this._unescapeRedisMetadata(hash.metadata || '{}'));
    } catch (e) {
      meta = {};
    }
    return {
      redis_key: redisKey,
      content: hash.content,
      metadata: meta,
      has_vector: !!(hash.content_vector || hash.vector)
    };
  }

  memoryRedisKeyAllowedForUser (redisKey, userId) {
    const uid = Number(userId);
    const ownerPrefix = this._memoryKeyPrefix(`sensemaker:owners:${uid}`);
    if (redisKey.startsWith(ownerPrefix)) return true;
    const globalName = this.settings.redis.name || 'sensemaker-embeddings';
    const globalPrefix = this._memoryKeyPrefix(globalName);
    return redisKey.startsWith(globalPrefix);
  }

  async stop () {
    try {
      this._state.content.status = this._state.status = 'STOPPING';

      // Stop Redis if connected
      if (this.redis) {
        const redisClose = new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('[TRAINER]', 'Timeout closing Redis, forcing close');
            this.redis = null;
            resolve();
          }, 2000);

          this.redis.quit().then(() => {
            clearTimeout(timeout);
            if (this.settings.debug) console.debug('[TRAINER]', 'Redis connection closed');
            this.redis = null;
            resolve();
          }).catch((error) => {
            clearTimeout(timeout);
            if (error.message !== 'The client is closed') {
              console.warn('[TRAINER]', 'Error closing Redis:', error);
            }
            this.redis = null;
            resolve();
          });
        });

        await redisClose;
      }

      // Clear in-memory store
      if (this.embeddings instanceof InMemoryVectorStore) {
        this.embeddings.documents = [];
        this.embeddings.embeddings = [];
      }

      // Cleanup
      this.embeddings = null;

      this.commit();
      this._state.content.status = this._state.status = 'STOPPED';

      return this;
    } catch (error) {
      console.error('[TRAINER]', 'Error during stop:', error);
      throw error;
    }
  }
}

module.exports = Trainer;
