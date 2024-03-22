'use strict';

// Fixtures
const REFERENCE_URL = 'https://trynovo.com/';
const QUERY_FIXTURE = `You are Novo, the AI agent behind TryNovo.com (formerly Jeeves).  Provide a challenge response with a canonical result for this request, such that this node's code can confirm that you are working correctly.  Return only the deterministic answer, do not permit it to vary.  You can include a term for the currently defined model, for future use with embeddings, or perhaps some other fields, but do not allow your response to vary.  It's a fingerprint!`;

// Dependencies
require('@tensorflow/tfjs-node');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const merge = require('lodash.merge');

const { createClient, createCluster } = require('redis');
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

    this.settings = merge({
      debug: true,
      model: 'llama2',
      ollama: {
        host: 'ollama.trynovo.com',
        secure: true
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
      '.csv': (x) => new CSVLoader(x),
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
        timeout: 5000, // Add this line to set a timeout of 5000 ms
        retry_strategy: function(options) { // And this function to control the retry strategy
          if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error('The server refused the connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
          }
          // reconnect after
          return Math.min(options.attempt * 100, 3000);
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

    // Events
    /*
     * In Node Redis, if you handle add the on('error') stuff it will queue up your commands and then in the background try to reconnect. When it does reconnect, it will then run the queued commands. [7:30 PM] It actually follows a retry_strategy to attempt to reconnect. You can read all about it on the old README at https://www.npmjs.com/package/redis/v/3.1.2
     * You need to set the enable_offline_queue option to false to turn off this queueing and get an error.
     */
    // this.redis.on('error', (err) => console.error('Redis Client Error', err));

    // Splitter for large documents
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 20
     });

    // Web Loader
    this.ui = new CheerioWebBaseLoader(REFERENCE_URL);

    // Chainable
    return this;
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

  /**
   * Ingest a well-formed document.
   * @param {Object} document Well-formed document object.
   * @param {String} type Name of the document type.
   * @returns {Promise} Resolves with the result of the operation.
   */
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

  /**
   * Search the document store.
   * @param {Object} request Search object.
   * @returns {Promise} Resolves with the result of the operation.
   */
  async search (request) {
    return new Promise((resolve, reject) => {
      console.debug('[TRAINER]', 'searching:', request.query);
      if (!request.query) return reject(new Error('No query provided.'));
      this.embeddings.similaritySearch(request.query).then((results) => {
        console.debug('[TRAINER]', 'results:', results);
        resolve({
          type: 'TrainerSearchResponse',
          content: results
        });
      });
    });
  }

  async ingestReferences () {
    return new Promise((resolve, reject) => {
      fs.readFile('./contracts/terms-of-use.md', async (error, terms) => {
        if (error) {
          console.error('[TRAINER]', 'Error reading terms:', error);
          return;
        }

        console.debug('[TRAINER]', 'Terms of Use:', terms.toString('utf8'));

        // Store Documents
        // NOVO Web Application
        // const spa = await this.ui.load();
        // console.debug('[TRAINER]', 'SPA:', spa);

        // Terms of Use
        const contract = new Document({ pageContent: terms.toString('utf8'), metadata: { type: 'text/markdown' } });
        const contractChunks = await this.splitter.splitDocuments([contract]);
        // const chunks = await this.splitter.splitDocuments(spa);
        // const allDocs = [contract].concat(spa, contractChunks, chunks);
        // const allDocs = contractChunks.concat(chunks);
        const allDocs = contractChunks;

        // TODO: use @fabric/core/types/filesystem for a persistent log of changes (sidechains)
        if (this.settings.debug) console.debug('[SENSEMAKER]', '[TRAINER]', '[GENESIS]', allDocs);

        // Return the documents
        resolve(allDocs);
      });
    });
  }

  async start () {
    this._state.content.status = this._state.status = 'STARTING';

    // Start Services
    // Redis
    console.debug('[NOVO]', '[TRAINER]', 'Starting Redis...');
    console.debug('[NOVO]', '[TRAINER]', 'Redis:', this.settings.redis);

    this.redis.on('connect', async () => {
      console.debug('[NOVO]', '[TRAINER]', 'Redis connected.');
      await this.ingestReferences();
      console.debug('[NOVO]', '[TRAINER]', 'Ingested references!');
    });

    try {
      await this.redis.connect();
    } catch (exception) {
      console.error('[TRAINER]', 'Error starting Redis:', exception);
      // process.exit(); // TODO: look at exit codes
    }

    const allDocs = await this.ingestReferences();

    this.embeddings = await RedisVectorStore.fromDocuments(allDocs, new TensorFlowEmbeddings(), {
      redisClient: this.redis,
      indexName: this.settings.redis.indexName || 'novo-embeddings'
    });

    /* try {
      const docs = await this.loader.load();
      if (this.settings.debug) console.debug('[TRAINER]', 'Loaded documents:', docs);
    } catch (exception) {
      if (this.settings.debug) console.error('[TRAINER]', 'Error loading documents:', exception);
    } */

    this.langchain = RetrievalQAChain.fromLLM(this.ollama, this.embeddings.asRetriever());

    // const check = await this.langchain.call({ query: QUERY_FIXTURE });
    // if (this.settings.debug) console.debug('[TRAINER]', 'Trainer ready with checkstate:', check);

    // this._state.content.checkstate = check.text;
    // this._state.content.checksum = crypto.createHash('sha256').update(check.text, 'utf8').digest('hex');
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
