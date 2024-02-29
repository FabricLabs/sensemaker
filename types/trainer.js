'use strict';

// Fixtures
const REFERENCE_URL = 'https://trynovo.com/';
const QUERY_FIXTURE = `You are Novo, the AI agent behind TryNovo.com (formerly Jeeves).  Provide a challenge response with a canonical result for this request, such that this node's code can confirm that you are working correctly.  Return only the deterministic answer, do not permit it to vary.  You can include a term for the currently defined model, for future use with embeddings, or perhaps some other fields, but do not allow your response to vary.  It's a fingerprint!`;

// Dependencies
require('@tensorflow/tfjs-node');
const { createClient } = require('redis');
const { Ollama } = require('@langchain/community/llms/ollama');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { RetrievalQAChain } = require('langchain/chains');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { RedisVectorStore } = require('@langchain/redis');
const { CheerioWebBaseLoader } = require('langchain/document_loaders/web/cheerio');
const { TensorFlowEmbeddings } = require('@langchain/community/embeddings/tensorflow');
const { Document } = require('@langchain/core/documents');

// Fabric Types
const Service = require('@fabric/core/types/service');

// Types
const Agent = require('./agent');

/**
 * Implements document ingestion.
 */
class Trainer extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      model: 'llama2',
      ollama: {},
      redis: {
        url: 'redis://localhost:6379'
      }
    }, settings);

    this.agent = new Agent();
    this.embeddings = null;
    this.ollama = new Ollama(this.settings.ollama);
    this.langchain = null;
    this.redis = createClient({ url: this.settings.redis.url || 'redis://localhost:6379' });

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 20
     });

    return this;
  }

  async ingestDocument (document) {
    return new Promise((resolve, reject) => {
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
    await this.redis.connect();

    const reference = new CheerioWebBaseLoader(REFERENCE_URL);
    const spa = await reference.load();
    const chunks = await this.splitter.splitDocuments(spa);

    this.embeddings = await RedisVectorStore.fromDocuments(chunks, new TensorFlowEmbeddings(), {
      redisClient: this.redis,
      indexName: 'documents'
    });

    this.langchain = RetrievalQAChain.fromLLM(this.ollama, this.embeddings.asRetriever());

    this.commit();

    const check = await this.langchain.call({ query: QUERY_FIXTURE });
    console.debug('[TRAINER]', 'Trainer ready with checkstate:', check);

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
