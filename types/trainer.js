'use strict';

// Fixtures
const REFERENCE_URL = 'https://sensemaker.io/';
const QUERY_FIXTURE = `You are SENSEMAKER, the AI agent behind sensemaker.io.  Provide a challenge response with a canonical result for this request, such that this node's code can confirm that you are working correctly.  Return only the deterministic answer, do not permit it to vary.  You can include a term for the currently defined model, for future use with embeddings, or perhaps some other fields, but do not allow your response to vary.  It's a fingerprint!`;

// Constants
const {
  EMBEDDING_MODEL
} = require('../constants');

// Dependencies
const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');
const merge = require('lodash.merge');
const fetch = require('cross-fetch');

const { createClient, createCluster } = require('redis');
const { Ollama } = require('@langchain/community/llms/ollama');

// Text Splitter
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

// Loaders
const { DirectoryLoader } = require('langchain/document_loaders/fs/directory');
// const { JSONLoader, JSONLinesLoader } = require('langchain/document_loaders/fs/json');
const { TextLoader } = require('langchain/document_loaders/fs/text');
// const { CSVLoader } = require('langchain/document_loaders/fs/csv');
// const { MarkdownLoader } = require('langchain/document_loaders/fs/markdown');
// const { PDFLoader } = require('langchain/document_loaders/fs/pdf');

// Langchains
const { RetrievalQAChain } = require('langchain/chains');
const { createRetrievalChain } = require('langchain/chains/retrieval');
// const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { RedisVectorStore } = require('@langchain/redis');
const { OllamaEmbeddings } = require('@langchain/ollama');
const { Document } = require('@langchain/core/documents');
const { VectorStore } = require('@langchain/core/vectorstores');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Sensemaker Types
const Agent = require('./agent');

/**
 * Simple in-memory vector store for testing and development.
 */
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
      debug: true,
      model: 'llama2',
      ollama: {
        host: 'localhost',
        secure: false
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

    this.agent = new Agent();
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
    this.redis = createClient({
      username: this.settings.redis.username,
      password: this.settings.redis.password,
      socket: {
        host: this.settings.redis.host,
        port: this.settings.redis.port,
        enable_offline_queue: false,
        timeout: 10000, // Increased timeout to 10 seconds
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('[TRAINER] Redis connection failed after 10 retries');
            return new Error('Redis connection failed after 10 retries');
          }
          const delay = Math.min(retries * 100, 3000);
          console.debug(`[TRAINER] Redis reconnecting in ${delay}ms...`);
          return delay;
        }
      }
    });

    // Cluster
    /* this.redis = createCluster({
      rootNodes: [
        {
          host: this.settings.redis.host,
          port: this.settings.redis.port
        }
      ],
      defaults: {
        password: this.settings.redis.password
      }
    }); */

    // Splitter for large documents
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4096,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", " ", ""]
    });

    // Web Loader
    // this.ui = new CheerioWebBaseLoader(REFERENCE_URL);

    // Chainable
    return this;
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
    return new Promise((resolve, reject) => {
      const loader = new DirectoryLoader(directory, this.loaders);

      loader.load().then((docs) => {
        this.embeddings.addDocuments(docs).then(() => {
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

  async getStoreForOwner (id) {
    const name = new Actor({ name: `sensemaker/owners/${id}` });
    const reference = new Document({ pageContent: name.toGenericMessage() });
    const embeddings = await RedisVectorStore.fromDocuments([reference], new OllamaEmbeddings(), {
      redisClient: this.redis,
      indexName: `sensemaker:owners:${id}`
    });

    return embeddings;
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
      console.debug('[TRAINER]', 'Ingesting document:', document);

      try {
        // Split document into chunks
        const doc = new Document({ pageContent: document.content, metadata: document.metadata });
        const chunks = await this.splitter.splitDocuments([doc]);
        console.debug('[TRAINER]', `Split document into ${chunks.length} chunks`);

        let embeddings = null;

        // Segment embeddings by user
        if (document.metadata.owner) {
          embeddings = await this.getStoreForOwner(document.metadata.owner);
        } else {
          embeddings = this.embeddings;
        }

        // Process each chunk
        const results = [];
        for (const chunk of chunks) {
          const actor = new Actor({ content: chunk.pageContent });
          const endpoint = `http${(this.settings.ollama.secure) ? 's' : ''}://${this.settings.ollama.host}:${this.settings.ollama.port}/api/embeddings`;
          const response = await fetch(endpoint, {
            headers: {
              'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
              model: EMBEDDING_MODEL,
              prompt: chunk.pageContent
            })
          });

          const json = await response.json();
          if (this.settings.debug) console.debug('[TRAINER]', endpoint, 'got embedding json:', json);

          const inserted = await this.db('embeddings').insert({
            fabric_id: actor.id,
            content: JSON.stringify(json.embedding)
          });

          if (!inserted || !inserted.length) {
            throw new Error('No embeddings inserted.');
          }

          if (this.settings.debug) console.debug('[TRAINER]', 'Inserted:', inserted);

          // Add chunk to vector store
          await embeddings.addDocuments([chunk]);

          // Emit event
          this.emit('TrainerDocument', {
            id: actor.id,
            metadata: chunk.metadata,
            content: chunk.pageContent
          });

          results.push({ type: 'Embedding', content: { type: EMBEDDING_MODEL, content: json.embedding } });
        }

        resolve({ type: 'EmbeddingBatch', content: results });
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

  async query (request) {
    return new Promise(async (resolve, reject) => {
      /* const embedded = await this.embeddings.embedQuery(request.query);
      console.debug('Embedded query:', embedded); */
      if (this.settings.debug) console.debug('[TRAINER]', 'Handling request:', request);
      let store = null;
      if (request.user) {
        const messages = (request.messages) ? request.messages.map((m) => {
          return new Document({ pageContent: m });
        }) : [];

        store = await this.getStoreForOwner(request.user.id);
        store.addDocuments(messages);
      } else {
        store = this.embeddings;
      }

      // TODO: replace with `createRetrievalChain`
      RetrievalQAChain.fromLLM(this.ollama, store.asRetriever()).call({
        messages: request.messages,
        query: request.query
      }).catch(reject).then((answer) => {
        if (this.settings.debug) console.debug('[TRAINER]', 'Answer:', answer);
        if (!answer || !answer.text) return reject(new Error('No answer provided.'));
        resolve({
          type: 'TrainerQueryResponse',
          content: answer.text,
          messages: request.messages,
          query: request.query
        });
      });
    });
  }

  /**
   * Search the document store.
   * @param {Object} request Search object.
   * @returns {Promise} Resolves with the result of the operation.
   */
  async search (request, limit = 100) {
    return new Promise((resolve, reject) => {
      console.debug('[TRAINER]', 'searching:', request);
      let filter = null;
      if (!request.query) return reject(new Error('No query provided.'));
      /* if (request.filter) {
        for (const [key, value] of Object.entries(request.filter)) {
          if (key === 'type') filter = x => x.metadata.type === value;
        }
      } */
      filter = request.filter;

      this.embeddings.similaritySearch(request.query, (request.limit || limit), filter || { type: 'case' }).catch((error) => {
        console.error('[TRAINER]', 'Error searching:', error);
        reject(error);
      }).then((results) => {
        const map = {};

        results.forEach((x) => {
          const actor = new Actor({ content: x.pageContent });
          map[actor.id] = { id: actor.id, content: x.pageContent };
        });

        resolve({
          type: 'TrainerSearchResponse',
          content: Object.values(map)
        });
      });
    });
  }

  async start () {
    return new Promise(async (resolve, reject) => {
      console.debug('[TRAINER] Starting service...');
      this._state.content.status = this._state.status = 'STARTING';
      // Add Redis event handlers
      this.redis.on('error', (err) => {
        console.error('[TRAINER] Redis Client Error:', err);
      });

      this.redis.on('connect', () => {
        console.debug('[TRAINER] Redis Client Connected');
      });

      this.redis.on('reconnecting', () => {
        console.debug('[TRAINER] Redis Client Reconnecting...');
      });

      this.redis.on('end', () => {
        console.debug('[TRAINER] Redis Client Connection Closed');
      });

      // Connect to Redis with timeout
      const connectWithTimeout = new Promise((resolveRedis, rejectRedis) => {
        const timeout = setTimeout(() => {
          rejectRedis(new Error('Redis connection timeout'));
        }, 15000); // 15 second timeout

        // Attempt Redis connection
        this.redis.connect().then(() => {
          clearTimeout(timeout);
          resolveRedis();
        }).catch((error) => {
          clearTimeout(timeout);
          rejectRedis(error);
        });
      });

      try {
        await connectWithTimeout;
        console.debug('[TRAINER] Redis connected successfully');

        try {
          // Initialize vector store
          const allDocs = await this.ingestReferences();
          console.debug('[TRAINER] References loaded, creating vector store...');

          this.embeddings = await RedisVectorStore.fromDocuments(allDocs, new OllamaEmbeddings(), {
            redisClient: this.redis,
            indexName: this.settings.redis.name || 'sensemaker-embeddings'
          });

          console.debug('[TRAINER] Vector store initialized successfully');
          this._state.content.status = this._state.status = 'STARTED';
          this.commit();
          resolve(this);
        } catch (error) {
          console.error('[TRAINER] Error initializing vector store:', error);
          throw error;
        }
      } catch (error) {
        console.error('[TRAINER] Error during start:', error);
        this._state.content.status = this._state.status = 'ERROR';
        reject(error);
      }
    });
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
          }, 5000);

          this.redis.quit().then(() => {
            clearTimeout(timeout);
            console.debug('[TRAINER]', 'Redis connection closed');
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
