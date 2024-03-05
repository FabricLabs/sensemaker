'use strict';

// Fixtures
const REFERENCE_URL = 'https://trynovo.com/';
const QUERY_FIXTURE = `You are Novo, the AI agent behind TryNovo.com (formerly Jeeves).  Provide a challenge response with a canonical result for this request, such that this node's code can confirm that you are working correctly.  Return only the deterministic answer, do not permit it to vary.  You can include a term for the currently defined model, for future use with embeddings, or perhaps some other fields, but do not allow your response to vary.  It's a fingerprint!`;

// Dependencies
require('@tensorflow/tfjs-node');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { createClient } = require('redis');
const { Ollama } = require('@langchain/community/llms/ollama');

// Text Splitter
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

// Loaders
const { DirectoryLoader } = require('langchain/document_loaders/fs/directory');
const { JSONLoader, JSONLinesLoader } = require('langchain/document_loaders/fs/json');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { CSVLoader } = require('langchain/document_loaders/fs/csv');
// const { MarkdownLoader } = require('langchain/document_loaders/fs/markdown');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');

// Langchains
const { RetrievalQAChain } = require('langchain/chains');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { RedisVectorStore } = require('@langchain/redis');
const { CheerioWebBaseLoader } = require('langchain/document_loaders/web/cheerio');
const { TensorFlowEmbeddings } = require('@langchain/community/embeddings/tensorflow');
const { Document } = require('@langchain/core/documents');

// Fabric Types
const Service = require('@fabric/core/types/service');

// Sensemaker Types
const Agent = require('./agent');

/**
 * Implements document ingestion.
 */
class Trainer extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      debug: true,
      model: 'llama2',
      ollama: {},
      redis: {
        host: 'localhost',
        password: null,
        port: 6379,
        url: 'redis://localhost:6379'
      },
      store: {
        path: '/media/storage/node/stores'
      }
    }, settings);

    this.agent = new Agent();
    this.embeddings = null;
    this.ollama = new Ollama(this.settings.ollama);
    this.langchain = null;
    this.loader = new DirectoryLoader(this.settings.store.path, {
      '.*': (x) => new TextLoader(x), // default to text
      // '.json': (x) => new JSONLoader(x, '/json'),
      // '.json': (x) => new TextLoader(x),
      // '.jsonl': (x) => new JSONLinesLoader(x, '/jsonl'),
      '.txt': (x) => new TextLoader(x),
      '.csv': (x) => new CSVLoader(x),
      // '.md': (x) => new MarkdownLoader(x),
      // '.pdf': (x) => new PDFLoader(x),
      '.pdf': (x) => new TextLoader(x),
    });

    this.redis = createClient({
      password: this.settings.redis.password,
      socket: {
        host: this.settings.redis.host,
        port: this.settings.redis.port
      }
    });

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 20
     });

    this.ui = new CheerioWebBaseLoader(REFERENCE_URL);

    return this;
  }

  async ingestDirectory (directory) {
    return new Promise((resolve, reject) => {
      const loader = new DirectoryLoader(directory, {
        '.*': (x) => new TextLoader(x), // default to text
        // '.json': (x) => new JSONLoader(x, '/json'),
        // '.json': (x) => new TextLoader(x),
        // '.jsonl': (x) => new JSONLinesLoader(x, '/jsonl'),
        '.txt': (x) => new TextLoader(x),
        '.csv': (x) => new CSVLoader(x),
        // '.md': (x) => new MarkdownLoader(x),
        // '.pdf': (x) => new PDFLoader(x),
        '.pdf': (x) => new TextLoader(x),
      });

      loader.load().then((docs) => {
        this.embeddings.addDocuments(docs).then(() => {
          resolve({ type: 'IngestedDirectory', content: docs });
        });
      }).catch((exception) => {
        console.error('[TRAINER]', 'Error ingesting directory:', exception);
        reject(exception);
      });
    });
  }

  async ingestDocument (document, type = 'text') {
    return new Promise((resolve, reject) => {
      if (!document.metadata) document.metadata = {};
      document.metadata.type = type;
      const element = new Document({ pageContent: document.content, metadata: document.metadata });
      this.embeddings.addDocuments([element]).catch(reject).then(() => {
        resolve({ type: 'IngestedDocument', content: element });
      });
    });
  }

  async ingestURL (url) {
    return new Promise((resolve, reject) => {
      const reference = new CheerioWebBaseLoader(url);
      reference.load().then((spa) => {
        this.splitter.splitDocuments(spa).then((chunks) => {
          this.embeddings.addDocuments(chunks).then(() => {
            resolve({ type: 'IngestedURL', content: chunks });
          });
        });
      });
    });
  }

  async query (request) {
    return new Promise((resolve, reject) => {
      this.langchain.call({ query: request.query }).then((answer) => {
        resolve({
          type: 'TrainerQueryResponse',
          content: answer
        });
      });
    });
  }

  async search (request) {
    return new Promise((resolve, reject) => {
      console.debug('[TRAINER]', 'searching:', request.query);
      if (!request.query) return reject(new Error('No query provided.'));
      this.embeddings.similaritySearch(request.query).then((results) => {
        console.debug('results:', results);
        resolve({
          type: 'TrainerSearchResponse',
          content: results
        });
      });
    });
  }

  async start () {
    this._state.content.status = this._state.status = 'STARTING';

    // Start Services
    // Redis
    try {
      await this.redis.connect();
    } catch (exception) {
      console.error('[TRAINER]', 'Error starting Redis:', exception);
      process.exit(); // TODO: look at exit codes
    }

    const terms = fs.readFileSync('./contracts/terms-of-use.md').toString('utf8');
    const spa = await this.ui.load();

    // Store Documents
    const contract = new Document({ pageContent: terms, metadata: { type: 'text/markdown' } });
    const contractChunks = await this.splitter.splitDocuments([contract]);
    const chunks = await this.splitter.splitDocuments(spa);
    const allDocs = [contract].concat(spa, contractChunks, chunks);

    // TODO: use @fabric/core/types/filesystem for a persistent log of changes (sidechains)
    if (this.settings.debug) console.debug('[SENSEMAKER]', '[TRAINER]', '[GENESIS]', allDocs);

    this.embeddings = await RedisVectorStore.fromDocuments(allDocs, new TensorFlowEmbeddings(), {
      redisClient: this.redis,
      indexName: 'documents'
    });

    try {
      const docs = await this.loader.load();
      if (this.settings.debug) console.debug('[TRAINER]', 'Loaded documents:', docs);
    } catch (exception) {
      if (this.settings.debug) console.error('[TRAINER]', 'Error loading documents:', exception);
    }

    this.langchain = RetrievalQAChain.fromLLM(this.ollama, this.embeddings.asRetriever());

    const check = await this.langchain.call({ query: QUERY_FIXTURE });
    if (this.settings.debug) console.debug('[TRAINER]', 'Trainer ready with checkstate:', check);

    this._state.content.checkstate = check.text;
    this._state.content.checksum = crypto.createHash('sha256').update(check.text, 'utf8').digest('hex');
    this._state.content.status = this._state.status = 'STARTED';

    this.commit();

    return this;
  }

  async stop () {
    this._state.content.status = this._state.status = 'STOPPING';

    // Stop Services
    await this.redis.quit();

    // Commit
    this.commit();
    this._state.content.status = this._state.status = 'STOPPED';

    return this;
  }
}

module.exports = Trainer;
