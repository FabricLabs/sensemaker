/**
 * # Sensemaker Core
 * This file contains the main class definition for the Sensemaker service.  
 * Methods prefixed by `_` are considered private and should not be called directly.
 * @extends {Hub} Instance of Fabric Hub (`@fabric/hub`), the reference implementation of a Fabric Edge server.
 */
'use strict';

// Prepare transpilation
require('@babel/register');

// Package
const definition = require('../package');
const {
  SNAPSHOT_INTERVAL,
  AGENT_MAX_TOKENS,
  MAX_RESPONSE_TIME_MS,
  PER_PAGE_LIMIT,
  PER_PAGE_DEFAULT,
  USER_QUERY_TIMEOUT_MS,
  SYNC_EMBEDDINGS_COUNT
} = require('../constants');

// Dependencies
const fs = require('fs');
const crypto = require('crypto');

// External Dependencies
const { createClient } = require('redis');
const fetch = require('cross-fetch');
const debounce = require('lodash.debounce');
const merge = require('lodash.merge');
// TODO: use levelgraph instead of level?
// const levelgraph = require('levelgraph');
const knex = require('knex');
const multer = require('multer');
// const { ApolloServer, gql } = require('apollo-server-express');
// TODO: use bcryptjs instead of bcrypt?
// const { attachPaginate } = require('knex-paginate'); // pagination
const { hashSync, compareSync, genSaltSync } = require('bcrypt'); // user authentication
const { getEncoding, encodingForModel } = require('js-tiktoken'); // local embeddings

// Fabric
const Hub = require('@fabric/hub'); // messaging hub

// HTTP Bridge
const HTTPServer = require('@fabric/http/types/server'); // fabric edge server
// const Sandbox = require('@fabric/http/types/sandbox'); // edge client sandbox (web browser)

// Fabric Types
// TODO: reduce to whole library import?
// const App = require('@fabric/core/types/app');
const Key = require('@fabric/core/types/key'); // fabric keys
const Peer = require('@fabric/core/types/peer'); // fabric peers
const Token = require('@fabric/core/types/token'); // fabric tokens
const Actor = require('@fabric/core/types/actor'); // fabric actors
const Chain = require('@fabric/core/types/chain'); // fabric chains
const Logger = require('@fabric/core/types/logger');
// const Worker = require('@fabric/core/types/worker');
const Message = require('@fabric/core/types/message');
const Service = require('@fabric/core/types/service');
const Collection = require('@fabric/core/types/collection');
const Filesystem = require('@fabric/core/types/filesystem');

// Sources
const Bitcoin = require('@fabric/core/services/bitcoin');
// const WebHooks = require('@fabric/webhooks');
const Discord = require('@fabric/discord');
// const GitHub = require('@fabric/github');
const Matrix = require('@fabric/matrix');
// const Twilio = require('@fabric/twilio');
// const Twitter = require('@fabric/twitter');

// Providers
// const { StatuteProvider } = require('../libraries/statute-scraper');

// Services
const Fabric = require('./fabric');
const EmailService = require('./email');
const Gemini = require('./gemini');
const Mistral = require('./mistral');
const OpenAI = require('./openai');
const Stripe = require('./stripe');

// Internal Types
const Agent = require('../types/agent');
// const Brain = require('../types/brain');
const Coordinator = require('../types/coordinator');
const Learner = require('../types/learner');
const Trainer = require('../types/trainer');
const Worker = require('../types/worker');
const Queue = require('../types/queue');

// Functions
const toMySQLDatetime = require('../functions/toMySQLDatetime');
const IngestFile = require('../functions/IngestFile');
const KnexCacher = require('../functions/KnexCacher');
const KnexPaginator = require('../functions/KnexPaginator');

// Routes (Request Handlers)
const ROUTES = require('../routes');

/**
 * Sensemaker is the primary instance of the AI.
 * @type {Object}
 * @extends {Service}
 */
class Sensemaker extends Hub {
  /**
   * Constructor for the Sensemaker instance.
   * @param  {Object} [settings={}] Map of configuration values.
   * @param  {Number} [settings.seed] 12 or 24 word mnemonic seed.
   * @param  {Number} [settings.port=7777] Fabric messaging port.
   * @return {Sensemaker} Resulting instance of Sensemaker.
   */
  constructor (settings = {}) {
    super(settings);

    // Settings
    // TODO: extract defaults to `settings/default.json`
    this.settings = merge({
      crawl: false,
      debug: false,
      seed: null,
      port: 7777,
      precision: 8, // precision in bits for floating point compression
      persistent: true,
      path: './logs/sensemaker',
      coordinator: '!TsLXBhlUcDLbRtOYIU:fabric.pub',
      frequency: 0.01, // Hz (once every ~100 seconds)
      temperature: 0,
      rules: [
        'do not provide hypotheticals'
      ],
      db: {
        host: 'localhost',
        user: 'db_user_sensemaker',
        password: '',
        database: 'db_sensemaker'
      },
      files: {
        corpus: './sensemaker',
        path: './sensemaker-files',
        userstore: './sensemaker-files/uploads/users'
      },
      http: {
        hostname: 'localhost',
        listen: true,
        port: 4242
      },
      commitments: [],
      constraints: {
        tolerance: 100, // 100ms
        memory: {
          max: Math.pow(2, 26) // ~64MB RAM
        }
      },
      matrix: {},
      agents: null,
      ollama: {},
      openai: {},
      services: [
        'bitcoin',
        'matrix'
      ],
      state: {
        status: 'INITIALIZED',
        agents: {},
        collections: {
          documents: {},
          people: {}
        },
        counts: {
          documents: 0,
          people: 0
        },
        services: {
          bitcoin: {
            balance: 0
          },
        }
      },
      crawlDelay: 2500,
      interval: 86400 * 1000,
      verbosity: 2,
      verify: true,
      workers: 1,
    }, settings);

    // Vector Clock
    this.clock = 0;

    // Internals
    this.agent = new Peer(this.settings);
    // this.brain = new Brain(this.settings);
    this.chain = new Chain(this.settings);
    this.queue = new Queue(this.settings);
    this.audits = new Logger(this.settings);
    this.learner = new Learner(this.settings);
    this.trainer = new Trainer(this.settings);
    this.coordinator = new Coordinator({ name: 'Sensemaker', goals: this.settings.goals, actions: ['idle', 'proceed'], agent: this.settings.ollama });
    this.router = new Coordinator({ name: 'Router', goals: this.settings.goals, actions: ['idle', 'proceed'], agent: this.settings.ollama });
    // this.sandbox = new Sandbox(this.settings.sandbox);
    this.worker = new Worker(this.settings);

     // Services
    // Optional Services
    this.email = (this.settings.email && this.settings.email.enable) ? new EmailService(this.settings.email) : null;
    this.matrix = (this.settings.matrix && this.settings.matrix.enable) ? new Matrix(this.settings.matrix) : null;
    // this.github = (this.settings.github.enable) ? new GitHub(this.settings.github) : null;
    this.discord = (this.settings.discord.enable) ? new Discord(this.settings.discord) : null;

    // Other Services
    this.openai = new OpenAI(this.settings.openai);
    this.stripe = new Stripe(this.settings.stripe);

    // Collections
    this.actors = new Collection({ name: 'Actors' });
    this.feeds = new Collection({ name: 'Feeds '});
    this.messages = new Collection({ name: 'Messages' });
    this.objects = new Collection({ name: 'Objects' });
    this.sources = new Collection({ name: 'Sources' });

    // TODO: use path
    // TODO: enable recursive Filesystem (directories)
    this.fs = new Filesystem({ path: './stores/sensemaker' });

    // Fabric Setup
    this._rootKey = new Key({ xprv: this.settings.xprv });
    this._fabric = {
      ephemera: this._rootKey,
      token: new Token({ issuer: this._rootKey })
    };

    // Fabric
    this.fabric = new Fabric(this.settings.fabric);
    this.cluster = new Trainer(this.settings);

    // HTTP Interface
    this.http = new HTTPServer({
      path: 'assets',
      hostname: this.settings.http.hostname,
      interface: this.settings.http.interface,
      port: this.settings.http.port,
      middlewares: {
        userIdentifier: this._userMiddleware.bind(this)
      },
      // TODO: use Fabric Resources; routes and components will be defined there
      resources: {
        Document: {
          route: '/documents',
          components: {
            list: 'DocumentHome',
            view: 'DocumentView'
          }
        },
        Index: {
          route: '/',
          components: {
            list: 'sensemaker-index',
            view: 'sensemaker-index'
          }
        },
        Service: {
          route: '/services',
          components: {
            list: 'sensemaker-index',
            view: 'sensemaker-index'
          }
        }
      },
      sessions: false
    });

    // File Uploads
    // TODO: check for vulnerabilities, easy setup
    this.uploader = new multer({ dest: this.settings.files.path });

    // TODO: evaluate use of temperature
    this.openai.settings.temperature = this.settings.temperature;

    // Internals
    this.agents = {};
    this.healths = {};
    this.services = {};
    this.sources = {};
    this.workers = [];
    this.changes = new Logger({
      name: 'sensemaker',
      path: './stores'
    });

    // Sensemaker
    this.sensemaker = new Agent({
      name: 'SENSEMAKER',
      model: this.settings.ollama.model,
      rules: this.settings.rules,
      host: this.settings.ollama.host,
      port: this.settings.ollama.port,
      secure: this.settings.ollama.secure,
      prompt: this.settings.prompt
    });

    // Agent Collection
    this.alpha = new Agent({ name: 'ALPHA', host: null, prompt: this.settings.prompt, openai: this.settings.openai });
    // this.beta = new Agent({ name: 'BETA', model: this.settings.ollama.model, host: 'ollama.trynovo.com', port: 443, secure: true, prompt: this.settings.prompt, openai: this.settings.openai });
    this.gamma = new Agent({ name: 'GAMMA', model: this.settings.ollama.model, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt, openai: this.settings.openai });
    this.delta = new Agent({ name: 'DELTA', model: this.settings.ollama.model, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt, openai: this.settings.openai });

    // External Agents
    // this.gemini = new Gemini({ name: 'GEMINI', prompt: this.settings.prompt, ...this.settings.gemini, openai: this.settings.openai });

    // Well-known Models
    this.llama = new Agent({ name: 'LLAMA', model: 'llama3', host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt, openai: this.settings.openai });
    this.mistral = new Agent({ name: 'MISTRAL', model: 'mistral', host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt });
    // this.mixtral = new Agent({ name: 'MIXTRAL', model: 'mixtral', host: 'ollama.trynovo.com', port: 443, secure: true, prompt: this.settings.prompt });
    this.gemma = new Agent({ name: 'GEMMA', model: 'gemma', host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt });

    // Custom Models
    // NOTE: these are tested with `llama3` but not other models
    this.outliner = new Agent({ name: 'OUTLINER', rules: this.settings.rules, model: this.settings.ollama.model, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: 'You are OutlinerAI, an artificial intelligence (AI) designed to generate a list of section headers for a document to be written by other drafting AIs.  For each request, list all headings sequentially in an array, with each heading as an object containing `number`, `content` and `depth` properties.  Your responses should use the following template:\n```\n{\n  "type": "DocumentOutline",\n  "content": [\n    {\n      "number": 1,\n      "content": "Section 1",\n      "depth": 1\n    }\n  ]\n}\n```' });
    this.drafter = new Agent({ name: 'DRAFTER', rules: this.settings.rules, model: this.settings.ollama.model, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: 'You are DrafterAI, an artificial intelligence (AI) designed to draft sections of documents for later composition into complete documents.  For each request, generate the highest quality, most accurate and compelling text for the request.  Do not pretext the generated content with any decoration or explanation, simply produce the content.  You only ever produce the desired section, not the entire document, and you should expect your response to be concatenated verbatim to other sections for the complete document.  Respond using Markdown.' });
    this.searcher = new Agent({ name: 'SEARCHER', rules: this.settings.rules, model: this.settings.ollama.model, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: 'You are SearcherAI, designed to return only a search term most likely to return the most relevant results to the user\'s query, assuming your response is used elsewhere in collecting information from the Sensemaker database.  Refrain from using generic terms such as "case", "v.", "vs.", etc., and simplify the search wherever possible to focus on the primary topic.  Only ever return the search query as your response.  For example, when the inquiry is: "Find a case that defines the scope of First Amendment rights in online speech." you should respond with "First Amendment" (excluding the quote marks).  Your responses will be sent directly to the network, so make sure to only ever respond with the best candidate for a search term for finding documents most relevant to the user question.  Leverage abstractions to extract the essence of the user request, using step-by-step reasoning to predict the most relevant search term.', openai: this.settings.openai });
    this.usa = new Agent({ name: 'USA', model: this.settings.ollama.model, prompt: this.settings.prompt, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure });
    this.proofreader = new Agent({ name: 'PROOFREADER', prompt: 'You are ProofreaderAI, designed to correct the grammar and spelling of a given text.  Respond using Markdown.' });

    // Pipeline Datasources
    this.datasources = {
      bitcoin: { name: 'Bitcoin' }
    };

    // Streaming
    this.completions = {};
    this.primes = {};

    // State
    this._state = {
      clock: this.clock,
      status: 'STOPPED',
      actors: {},
      agents: {},
      audits: {},
      epochs: [],
      messages: {},
      objects: {},
      content: this.settings.state
    };

    if (this.settings.redis) {
      this.redis = createClient({
        username: this.settings.redis.username,
        password: this.settings.redis.password,
        socket: this.settings.redis
      });
    }

    // TODO: See if we can put this in its own file.
    knex.QueryBuilder.extend('paginate', KnexPaginator);

    // TODO: Try to reduce the scope of this to only the objects who need to use it. Instead of extending Redis to every
    // QueryBuilder object, only the objects who cache with Redis should have the Redis database instance as an object.
    knex.QueryBuilder.extend('redis', this.redis);

    // TODO: See if we can put this in its own file.
    knex.QueryBuilder.extend('cache', KnexCacher);

    // Database connections
    this.db = knex({
      client: 'mysql2',
      connection: {
        host: this.settings.db.host,
        port: this.settings.db.port,
        user: this.settings.db.user,
        password: this.settings.db.password,
        database: this.settings.db.database
      },
      pool: {
        min: 8,
        max: 128,
        afterCreate: (conn, done) => {
          // console.debug('[SENSEMAKER:CORE]', '[DB]', 'Connection created.');
          done(null, conn);
        }
      }
    });

    // attachPaginate();

    // Stop case
    /* process.on('exit', async () => {
      console.warn('Sensemaker is shutting down...');
      await this.stop();
    }); */

    return this;
  }

  get authority () {
    return `https://${this.settings.domain}`;
  }

  get version () {
    return definition.version;
  }

  /**
   * Extracts a list of possible combinations of a given array.
   * @param {Array} tokens List of tokens to combine.
   * @param {String} prefix Additional prefix to add to each combination.
   * @returns {Array} List of possible combinations.
   */
  combinationsOf (tokens, prefix = '') {
    if (!tokens.length) return prefix;
    if (tokens.length > 10) tokens = tokens.slice(0, 10);

    let result = [];

    // Recursively combine tokens
    for (let i = 0; i < tokens.length; i++) {
      const rest = tokens.slice(0, i).concat(tokens.slice(i + 1));
      const combinations = this.combinationsOf(rest, prefix + tokens[i] + ' ');
      result = result.concat(combinations);
    }

    // Add the original tokens
    result = result.concat(tokens);

    // Return unique results
    return [...new Set(result.map((item) => item.trim()))];
  }

  commit () {
    // console.debug('[SENSEMAKER:CORE]', '[COMMIT]', 'Committing state:', this._state);
    const commit = new Actor({
      type: 'Commit',
      object: {
        content: this.state
      }
    });

    // console.warn('Sensemaker is attempting a safe shutdown...');
    // TODO: safe shutdown
    this.emit('commit', commit);

    return this;
  }

  /**
   * Creates (and registers) a new {@link Agent} instance.
   * @param {Object} configuration Settings for the {@link Agent}.
   * @returns {Agent} Instance of the {@link Agent}.
   */
  createAgent (configuration = {}) {
    const agent = new Agent(configuration);
    // TODO: define Agent methods from `documentation`
    if (!this._state.agents[agent.id]) this._state.agents[agent.id] = agent;
    this._state.content.agents[agent.id] = configuration;
    // this.commit();
    this.emit('agent', agent);
    return agent;
  }

  /**
   * Provides a function to estimate the number of tokens in a given input string.
   * @param {String} input Input string to estimate.
   * @returns {Number} Estimated number of tokens.
   */
  estimateTokens (input) {
    const tokens = input.split(/\s+/g);
    const estimate = tokens.length * 4;
    return estimate;
  }

  /**
   * Extracts a list of important phrases from a given input string.
   * @param {String} input Input string to analyze.
   * @param {Number} limit Maximum number of phrases to return.
   * @returns {Array} List of important phrases in order of rank.
   */
  importantPhrases (input, limit = 5) {
    const tokens = input.replace(/[^\w\s\']|_/g, '').split(/\s+/g);
    const uniques = [...new Set(tokens)].filter((x) => x.length > 3);

    uniques.sort((a, b) => {
      return b.length - a.length;
    });

    return uniques;
  }

  /**
   * Extracts a list of important words from a given input string.
   * @param {String} input Input string to analyze.
   * @param {Number} limit Maximum number of words to return.
   * @returns {Array} List of important words in order of rank.
   */
  importantWords (input, limit = 5) {
    const tokens = input.replace(/[^\w\s\']|_/g, '').split(/\s+/g);
    const uniques = [...new Set(tokens)].filter((x) => x.length > 3);
    const nouns = this.properNouns(input);

    uniques.sort((a, b) => {
      return b.length - a.length;
    });

    uniques.sort((a, b) => {
      return nouns.includes(b) - nouns.includes(a);
    });

    return uniques.slice(0, limit);
  }

  /**
   * Extract a list of proper nouns from a given input string.
   * @param {String} input Input string to analyze.
   * @returns {Array} List of proper nouns.
   */
  properNouns (input) {
    return this.uniqueWords(input).filter((word) => /^[A-Z][a-z]*$/.test(word));
  }

  /**
   * Extract a list of unique words from a given input string.
   * @param {String} input Input string to analyze.
   * @returns {Array} List of unique words.
   */
  uniqueWords (input) {
    return [...new Set(this.words(input))].filter((x) => x.length > 3);
  }

  words (input) {
    return this.wordTokens(input);
  }

  wordTokens (input) {
    return input.replace(/[^\w\s\']|_/g, '').split(/\s+/g);
  }

  /**
   * Sends a system-wide alert.
   * @param {String} message Message to send in the alert.
   * @returns {Boolean} Returns `true` if the alert sent, `false` otherwise.
   */
  async alert (message) {
    if (this.email) {
      try {
        // Alert Tech
        await this.email.send({
            from: 'agent@sensemaker.io',
            to: 'tech@sensemaker.io',
            subject: `[ALERT] [SENSEMAKER:CORE] Sensemaker Alert`,
            html: message
        });
        console.debug('Alert email sent successfully!');
      } catch (error) {
        console.error('Error sending alert email:', error);
      }
    }

    return true;
  }

  /**
   * Generates an outline for a proposed document.
   * @param {Object} request Request object.
   * @returns {Object} Outline of the document.
   */
  async generateDocumentOutline (request) {
    const message = `Generate an outline of a document for the following request:\n\`\`\`\n${JSON.stringify(request, null, '  ')}\n\`\`\`\`\n\nRespond using JSON.`;
    return new Promise((resolve, reject) => {
      //nahuel: the only change i made in this is that actually the JSON.parse() wasnt calling response correctly
      this.outliner.query({ query: message }).then((response) => {
        console.debug('[SENSEMAKER:CORE]', 'Generated Document Outline (1st Pass):', response);

        let outline = null;

        try {
          outline = JSON.parse(response.content);
        } catch (exception) {
          console.error('[SENSEMAKER:CORE]', 'First pass generated incorrect JSON:', outline);
        }

        resolve(outline);
      }).catch((exception) => {
        reject(exception);
      });
    });
  }

  async generateDocumentSection (request) {
    const message = `Your next message is the appropriate text for the following section of the document for the following request:\n\`\`\`\n${JSON.stringify(request, null, '  ')}\n\`\`\`\``;
    return new Promise((resolve, reject) => {
      this.drafter.query({ query: message }).then((response) => {
        resolve(response);
      }).catch((exception) => {
        reject(exception);
      });
    });
  }

  async tick () {
    const now = (new Date()).toISOString();
    this._lastTick = JSON.parse(JSON.stringify(this.clock || 0));
    ++this.clock;
    this.commit();
    return {
      clock: this.clock,
      timestamp: now
    };
  }

  async ff (count = 0) {
    for (let i = 0; i < count; i++) {
      try {
        await this.tick();
      } catch (exception) {
        this.emit('error', `Could not fast-forward: ${exception}`);
      }
    }

    return this;
  }

  async beat () {
    const now = (new Date()).toISOString();
    const start = JSON.parse(JSON.stringify(this.clock));
    console.debug('[SENSEMAKER:CORE]', '[BEAT]', 'Start:', start);

    // TODO: remove async, use local state instead
    // i.e., queue worker job
    const balance = await this.services.bitcoin._syncBalanceFromOracle();
    const beat = Message.fromVector(['Generic', {
      clock: this.clock,
      balance: balance.data.content,
      created: now
    }]);

    await this.tick();

    this.worker.addJob({
      type: 'ScanCourtListener',
      params: [
        { query: 'Cases not yet synchronized with Sensemaker.' }
      ]
    });

    let data = beat.data;

    try {
      data = JSON.parse(data);
      data = JSON.stringify(data, null, '  ');
    } catch (exception) {
      this.emit('error', `Exception parsing beat: ${exception}`);
    }

    // this.alert('Heartbeat: ```\n' + data + '\n```');

    this.emit('beat', beat);
    this.emit('block', {
      created: now,
      transactions: []
    });

    return beat;
  }

  async checkHealth () {
    const CHAT_QUERY = 'Health check!  Tell me some status values.';

    return new Promise(async (resolve, reject) => {
      const now = new Date();
      const results = await Promise.allSettled(
        Object.values(this.agents).map((agent) => {
          return agent.query({ query: CHAT_QUERY, prompt: this.settings.prompt });
        })
      );

      const summaries = await Promise.allSettled([
        this.summarizer.query({ query: `Initial input: ${CHAT_QUERY}\nNetwork responses: ${JSON.stringify(results)}`, prompt: this.settings.prompt }),
      ]);

      resolve({
        created: now.toISOString(),
        duration: (new Date()) - now,
        results: results.concat(summaries)
      });
    });
  }

  /**
   * Generate a response to a given request.
   * @param {Object} request Request object.
   * @param {String} request.query Query text.
   * @param {String} [request.conversation_id] Unique identifier for the conversation.
   * @returns {Promise} Resolves with the response to the request.
   */
  async handleTextRequest (request) {
    return new Promise(async (resolve, reject) => {
      const now = new Date();
      const created = now.toISOString();

      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Handling request:', request);
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial query:', request.query);
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial messages:', request.messages);
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial timeout:', request.timeout);

      // Store user request
      const localMessageIDs = await this.db('messages').insert({ conversation_id: request.conversation_id, user_id: 1, status: 'computing', content: `${this.settings.name} is researching your question...` });
      const responseID = localMessageIDs[0];
      const responseName = `sensemaker/messages/${responseID}`;
      const responseObject = new Actor({ name: responseName });
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[BASICREQUEST]', 'Created response placeholder message:', localMessageIDs);

      // Prepare Metadata
      let messages = [];

      // Conversation Resume
      if (request.conversation_id) {
        console.debug('[SENSEMAKER:CORE]', '[BASICREQUEST]', 'Resuming conversation:', request.conversation_id);
        // Resume conversation
        const prev = await this._getConversationMessages(request.conversation_id);
        messages = prev.map((x) => {
          return { role: (x.user_id == 1) ? 'assistant' : 'user', name: (x.user_id == 1) ? '': undefined, content: x.content }
        });
      }

      // Prompt
      messages.unshift({
        role: 'system',
        content: this.settings.prompt
      });

      // Construct Metadata
      const meta = `` +
        `clock: ${this.clock}\n` +
        `created: ${created}\n`/* +
        `creator:` +
        `  name: ${request.username}\n` */;

      // Format Query Text
      const query = `---\n${meta}---\n${request.query}`;

      // Send Query
      this.sensemaker.query({ query: query, messages: messages }).catch((error) => {
        console.debug('[SENSEMAKER:CORE]', '[BASICREQUEST]', 'Sensemaker error:', error);
        reject(error);
      }).then(async (response) => {
        console.debug('[SENSEMAKER:CORE]', '[BASICREQUEST]', 'Response:', response);
        // Update database with completed response
        await this.db('messages').where({ id: responseID }).update({
          status: 'ready',
          content: response.content,
          updated_at: this.db.fn.now()
        });

        resolve(merge({}, response, {
          actor: { name: this.name },
          object: { id: responseObject.id }, // Fabric ID
          target: { id: `${this.authority}/messages/${responseID}` },
          message_id: responseID
        }));
      });
    });
  }

  async createConversationalMessage (message) {
    // TODO: receive from message parameter
    const localMessageIDs = await this.db('messages').insert({ conversation_id: message.conversation_id, user_id: 1, status: 'computing', content: `${this.settings.name} is researching your question...` });
    const responseID = localMessageIDs[0];
    const responseName = `sensemaker/messages/${responseID}`;
    const responseObject = new Actor({ name: responseName });
    return responseObject;
  }

  /**
   * Execute the default pipeline for an inbound request.
   * @param {Object} request Request object.
   * @param {Number} [timeout] How long to wait for a response.
   * @param {Number} [depth] How many times to recurse.
   * @returns {Message} Request as a Fabric {@link Message}.
   */
  async createTimedRequest (request, timeout = MAX_RESPONSE_TIME_MS, depth = 0) {
    return new Promise(async (resolve, reject) => {
      const now = new Date();
      const created = now.toISOString();

      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Handling request:', request);
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial query:', request.query);
      if (this.settings.debug) console.trace('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial messages:', request.messages);
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial timeout:', request.timeout);

      // Add Request to Database
      // TODO: assign `then` to allow async processing
      const inserted = await this.db('requests').insert({
        // TODO: add `user_id` to request, assign to `creator`
        created_at: toMySQLDatetime(now),
        content: JSON.stringify(request)
      });

      // Store user request
      // TODO: assign `then` to allow async processing
      const responseMessage = await this.db('messages').insert({
        conversation_id: request.conversation_id,
        user_id: 1,
        status: 'computing',
        content: `${this.settings.name} is researching your question...`
      });

      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Created response placeholder message:', responseMessage);

      // Create Request Message
      /* const message = Message.fromVector(['TimedRequest', JSON.stringify({
        created: created,
        request: request,
        response_message_id: responseMessage[0]
      })]); */

      // Notify workers
      this.emit('request', { id: inserted [0] });

      // TODO: prepare maximum token length
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Request:', request);

      // Pipeline Booleans
      let includeCases = true;
      let includeMatter = false;

      // Get Matter, if relevant
      if (request.matter_id) {
        console.trace('[SENSEMAKER:CORE]', '[PIPELINE]', 'Request has Matter ID:', request.matter_id);
        includeCases = false;
        includeMatter = true;

        // Attach the whole Matter
        request.matter = await this.db('matters').where({ id: request.matter_id }).first();

        // Get Matter's Conversations
        request.matter.conversations = await this.db('conversations').select(['title', 'created_at', 'updated_at', 'summary']).where({ matter_id: request.matter_id });

        // Get Matter's Files
        // TODO: pass only chunk of document, to reduce payload size and increase relevancy
        const matterFiles = await this.db('matters_files').where({ matter_id: request.matter_id });
        const retrievedFiles = await this.db('files')
          .whereIn('files.id', matterFiles.map((x) => x.file_id))
          .innerJoin('embeddings', 'files.embedding_id', 'embeddings.id')
          .select('files.*', 'embeddings.content as embedding');

        // Naive loop
        let files = [];
        for (const file of retrievedFiles) {
          // TODO: catch error
          const object = await this.retrieveFile(file.id)
          files.push(object);
        }

        request.matter.files = files.map((x) => {
          return {
            filename: x.name,
            content: x.content
          };
        });
      }

      // Action Model (Coordinator/Decider)
      const action = 'none';

      // Get the recommended action
      this.router.chooseAction({ action, request }).catch((error) => {
        console.error('[SENSEMAKER:CORE]', '[PIPELINE]', 'Coordinator error:', error);
      }).then(async (decision) => {
        console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Coordinator decision:', decision);
        const action = decision?.action;
        switch (action) {
          default:
            console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Unhandled action:', action);
            break;
        }

        // RAG
        const recently = [];

        // Variables
        let topical = [];
        let searchterm = null;

        // Expander
        // BEGIN EXPANDER
        if (this.settings.expander) {
          // Compute most relevant tokens
          // const hypotheticals = await this.lennon.query({ query: request.query });
          const words = this.importantWords(request.query);
          const phrases = this.importantPhrases(request.query);

          try {
            searchterm = await this.searcher.query({ query: `---\nquery:\n  ${request.query}\nmatter: ${JSON.stringify(request.matter || null)}\n---\nConsidering the metadata, what search term do you recommend?  Remember, return only the search term.`, tools: null, messages: request.messages });
            if (this.settings.debug) this.emit('debug', `Search Term: ${JSON.stringify(searchterm, null, '  ')}`);
            console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Search Term content:', searchterm.content);

            if (!searchterm.content) searchterm.content = '';

            // Remove whitespace
            searchterm.content = searchterm.content.trim();

            // Remove wrapping quotes
            searchterm.content = searchterm.content.replace(/^"/, '').replace(/"$/, ''); // exact double quotes
            searchterm.content = searchterm.content.replace(/^'/, '').replace(/'$/, ''); // exact single quotes
            searchterm.content = searchterm.content.replace(/^“/, '').replace(/”$/, ''); // fancy double quotes
            searchterm.content = searchterm.content.replace(/^‘/, '').replace(/’$/, ''); // fancy single quotes

            // Still too long!
            // TODO: convert limit here to constant
            if (searchterm.content.length > 50) {
              searchterm.content = searchterm.content.substr(0, 50);
            }

            console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Final Search Term:', searchterm.content);

            // Search for cases
            topical = await this._vectorSearchCases(searchterm.content);
          } catch (exception) {
            console.error('[SENSEMAKER:CORE]', '[PIPELINE]', 'Search Exception:', exception);
          }
        }
        // END EXPANDER

        // Compose YAML Frontmatter
        // TODO: reduce matter metadata to only relevant fields, use summary fields to compress context
        console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[META]', 'Matter:', request.matter);

        // Format Metadata
        const meta = `metadata:\n` +
          `  created: ${created}\n` +
          `  clock: ${this.clock}\n` +
          // TODO: use this new reduced metadata to reduce confusion / space consumed by metadata
          // (includeMatter && request.matter) ? `  matter:\n      title: ${request.matter.title}\n      files: ${JSON.stringify(request.matter.files)}\n` : '' +
          `  matter: ${JSON.stringify(request.matter)}\n` +
          // `  topics: ${searchterm.content || ''}\n` +
          // `  words: ${words.slice(0, 10).join(', ') + ''}\n` +
          // `  documents: null\n` +
          // `  counts:\n` +
          // `    documents: ` + documentCount.count +
          `\n`;

        // Format Query Text
        const query = `---\n` +
          meta +
          `---\n` +
          `${request.query}`;

        // Estimate Cost
        const metaTokenCount = this.estimateTokens(meta);
        const requestTokenCount = this.estimateTokens(request.query);
        const estimatedCost = requestTokenCount * 0.0001;

        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Meta:', meta);
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Meta Token Count:', metaTokenCount);
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Request Token Count:', requestTokenCount);
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Available Tokens:', AGENT_MAX_TOKENS - metaTokenCount - requestTokenCount);
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Estimated query embedding cost:', estimatedCost);
        console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Request size', query.length);

        let messages = [];

        if (request.conversation_id) {
          console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Resuming conversation:', request.conversation_id);
          // Resume conversation
          const prev = await this._getConversationMessages(request.conversation_id);
          messages = prev.map((x) => {
            return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
          });
        } else {
          // New conversation
          // messages = messages.concat([{ role: 'user', content: request.query }]);
        }

        if (request.subject) {
          // Subject material provided
          messages.unshift({ role: 'user', content: `Questions will be pertaining to "${request.subject}" as the subject of the inquiry.` });
        }

        if (request.matter_id) {
          console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Matter ID:', request.matter_id);
          console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Matter:', request.matter);
          messages = messages.concat([{ role: 'user', content: `Questions will be pertaining to ${request.matter.title}:\n\n\`\`\`\n${JSON.stringify(request.matter)}\n\`\`\`` }]);
        }

        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Matter Messages:', messages);

        // Prompt
        messages.unshift({
          role: 'system',
          content: this.settings.prompt
        });

        if (this.settings.debug) this.emit('debug', `[SENSEMAKER:CORE] [TIMEDREQUEST] Messages to evaluate: ${JSON.stringify(messages)}`);
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Agents to test:', Object.keys(this.agents));

        // TODO: Compressor
        // Use a reliable high-context agent to compress the query

        /* this.rag.query({ query: `Generate a SQL query for the following user request:\n\`\`\`\n${request.query}\n\`\`\`\n\nRemember, only ever respond with a SQL query that can be executed by me to return the results.  Do not wrap it in Markdown or a code block, the response must be only the raw query.`, messages }).catch((exception) => {
          console.error('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[RAG]', 'Exception:', exception);
        }).then(async (ragged) => {
          console.debug('RAGGED:', ragged);
          let results = null;
          try {
            results = await this.db.raw(ragged.content);
          } catch (exception) {
            console.error('[SENSEMAKER:CORE]', '[RAGGER]', 'Exception:', exception);
            console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[RAG]', 'Messages to regenerate with:', messages);
            this.rag.query({ query: `Your query failed:\n\`\`\`\n${exception.message}\n\`\`\`\n\nTry again, making sure to only return a valid SQL query given the provided schema.`, messages }).catch((exception) => {
              console.error('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[RAG]', 'Secondary Exception:', exception);
            }).then((ultimate) => {
              console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[RAG]', 'Ultimate:', ultimate);
            });
          }

          console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[RAG]', 'Results:', results);
        }); */

        // Initiate Network Query
        const networkPromises = Object.keys(this.agents).map((name) => {
          // console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[NETWORK]', 'Agent name:', name);
          // console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[NETWORK]', 'Agent:', this.agents[name]);
          return this.agents[name].query({ query, messages, /* requery: true */ });
        }).concat([
          // this.chatgpt.query({ query, messages, requery: true }),
          this.trainer.query({ query, messages }),
        ]);

        // Either all settle, or timeout
        Promise.race([
          Promise.allSettled(networkPromises),
          new Promise((resolve, reject) => setTimeout(reject, timeout, new Error('Timeout!')))
        ]).catch((error) => {
          console.error('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[NETWORK]', '[RESOLVER]', 'Error:', error);
        }).then(async (results) => {
          console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[NETWORK]', '[RESOLVER]', '[DEBUG]', 'Results:', results);
          if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[NETWORK]', '[RESOLVER]', 'Results:', results);
          if (!results) {
            console.error('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[NETWORK]', 'No results!');
            return;
          }

          // Filter the options again by a direct query, seeking the cases mentioned by ID or exact name
          const options = results.filter((x) => x.status === 'fulfilled').map((x) => x.value);
          // TODO: re-enable extractor for cards; file cards, case cards, jurisdiction cards, etc.
          /* for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[NETWORK]', 'Option:', option);
            /* this.extractor.query({
              query: `What cases are mentioned in this message:\n\`\`\`\n${JSON.stringify(option, null, '  ')}\n\`\`\``,
              json: true
            }).catch((exception) => {
              console.error('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[NETWORK]', 'Extractor Exception:', exception);
            }).then((extracted) => {
              console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', '[NETWORK]', 'Extracted:', extracted);
              // TODO: reject any answers including case titles not found in our database
              // problem: extractor may not extract useful case titles
            });
          } */

          const agentList = options.map((x) => `- [${x.name}] ${x.content}`).join('\n');
          this.summarizer.query({
            messages: messages,
            query: 'Answer the user query using the various answers provided by the agent network.  Use deductive logic and reasoning to verify the information contained in each, and respond as if their answers were already incorporated in your core knowledge.  The existence of the agent network, or their names, should not be revealed to the user.  Write your response as if they were elements of your own memory.\n\n```\nquery: ' + query + '\nagents:\n' + agentList + `\n\`\`\``,
          }).catch((exception) => {
            console.error('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Summarizer Exception:', exception);
            return reject(exception);
          }).then(async (summarized) => {
            if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Summarized:', summarized);
            if (!summarized) {
              console.trace('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'No summarized response!', summarized);
              return reject(new Error('No summarized response!'));
            }

            try {
              const actor = new Actor({ content: summarized.content });
              const documentIDs = await this.db('documents').insert({
                fabric_id: actor.id,
                content: summarized.content,
                owner: 1
              });

              const responseIDs = await this.db('responses').insert({
                actor: this.summarizer.id,
                content: `/documents/${documentIDs[0]}`
              });

              // Update database with completed response
              const updated = await this.db('messages').where({ id: responseMessage[0] }).update({
                status: 'ready',
                content: summarized.content,
                updated_at: this.db.fn.now()
              });

              console.debug('[SENSEMAKER:CORE]', '[HTTP]', '[MESSAGE]', 'Updated message:', updated);
              this.emit('response', {
                id: responseIDs[0],
                content: summarized.content
              });
            } catch (exception) {
              console.error('[SENSEMAKER:CORE]', '[HTTP]', '[MESSAGE]', 'Error inserting response:', exception);
            }

            // TODO: re-enable case cards, standardize to other card formats
            // Also consider attaching cards to all Agent outputs, referencing any named Collection as a card type
            /* let caseCards = null;
            const extracted = await this.extractor.query({
              query: `$CONTENT\n\`\`\`\n${summarized.content}\n\`\`\``
            });
            console.debug('[SENSEMAKER:CORE]', '[HTTP]', 'Got extractor output:', extracted);

            if (extracted && extracted.content) {
              console.debug('[SENSEMAKER:CORE]', '[EXTRACTOR]', 'Extracted:', extracted);
              try {
                caseCards = JSON.parse(extracted.content).map((x) => {
                  const actor = new Actor({ name: x });
                  return {
                    type: 'CaseCard',
                    content: {
                      id: actor.id,
                      title: x
                    }
                  };
                });

                console.debug('[SENSEMAKER:CORE]', '[HTTP]', '[MESSAGE]', 'Case Cards:', caseCards)
                // Find each case in the database and reject if not found
                const updated = await this.db('messages').where({ id: newMessage[0] }).update({
                  cards: JSON.stringify(caseCards.map((x) => x.content.id))
                });
              } catch (exception) {
                console.error('[SENSEMAKER:CORE]', '[HTTP]', '[MESSAGE]', 'Error updating cards:', exception);
              }
            } */

            const end = new Date();
            console.debug('[SENSEMAKER:CORE]', '[TIMEDREQUEST]', 'Duration:', (end.getTime() - now.getTime()) / 1000, 'seconds.');

            const answer = merge({}, summarized, {
              cards: [] || caseCards
            });

            resolve(answer);
          });
        });
      });
    });
  }

  async _getState () {
    // WARNING: this loads the int32 for every entity in the database
    const conversations = await this.db('conversations').select('id').from('conversations');
    const documents = await this.db('documents').select('id').from('documents');
    const inquiries = await this.db('inquiries').select('id', 'created_at', 'email').from('inquiries');
    const invitations = await this.db('invitations').select('id', 'created_at', 'updated_at', 'status').from('invitations');
    const messages = await this.db('messages').select('id').from('messages');

    // User Analytics
    const users = await this.db('users').select('id', 'username');

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const conversations = await this.db('conversations').select('id').where({ creator_id: user.id });
      const messages = await this.db('messages').select('id').where({ user_id: user.id });

      user.conversations = conversations.length;
      user.messages = messages.length;
    }

    const state = {
      conversations: {
        total: conversations.length,
        // content: conversations.map(x => x.id)
      },
      documents: {
        total: documents.length,
        // content: documents.map(x => x.id)
      },
      inquiries: {
        total: inquiries.length,
        content: inquiries
      },
      invitations: {
        total: invitations.length,
        content: invitations
      },
      messages: {
        total: messages.length
        // content: messages.map(x => x.id)
      },
      users: {
        total: users.length,
        content: users
      },
    };

    return state;
  }

  async processData (limit = 1000) {
    const now = new Date();
    const stats = { total: 0, processed: 0, unprocessed: 0 };
    /* 
    // const other = await this._getUnprocessedCaseStats();
    // const chunk = await this._getUnprocessedCases(limit);

    console.debug('[SENSEMAKER:CORE]', '[ETL]', 'Stats:', other, stats);

    const start = new Date();
    for (let i = 0; i < chunk.length; i++) {
      const instance = chunk[i];
      console.debug('[SENSEMAKER:CORE]', '[ETL]', 'Processing case:', instance.title, `[${instance.id}]`);
      // const nativeEmbedding = await this._generateEmbedding(`[sensemaker/cases/${instance.id}] ${instance.title}`);
      const titleEmbedding = await this._generateEmbedding(instance.title);
      await this.db('cases').where('id', instance.id).update({ title_embedding_id: titleEmbedding.id });
      stats.processed++;
    }

    console.debug('[SENSEMAKER:CORE]', '[ETL]', 'Complete in ', (new Date().getTime() - now.getTime()) / 1000, 'seconds.');
    console.debug('[SENSEMAKER:CORE]', '[ETL]', `Generated ${stats.processed} embeddings in ${(new Date().getTime() - start.getTime()) / 1000} seconds. (${stats.processed / ((new Date().getTime() - start.getTime()) / 1000)} embeddings per second)`);
    */
    return this;
  }

  async onJobCompleted (message) {
    const { job, result } = JSON.parse(message);
    console.debug('[SENSEMAKER:CORE] Job completed:', job, result);

    //job.method gives the job type, like 'IngestFile'
    //job.params[0] will give us the file/document id
    //result.status we can check if the job was 'COMPLETED'

    if (job) {
      const queueMessage = {
        job: job,
        type: 'completedJob',
        status: result.status === 'COMPLETED'? result.status : 'FAILED',
      };

      const messageTook = Message.fromVector([queueMessage.type, JSON.stringify(queueMessage)]);
      this.http.broadcast(messageTook);
    }

    if (result.status === 'COMPLETED') {
      const queueMessage = {
        type: job.method,
        param_id: job.params[0],
        completed: true,
      }

      try {
        switch (job.method) {
          case 'IngestFile':
            this._handleFileIngested(job.params[0]);
            const file = await this.db.select('creator','name').from('files').where({ id: job.params[0] }).first();
            queueMessage.creator = file.creator;
            queueMessage.filename = file.name;
            const messageFile = Message.fromVector([queueMessage.type, JSON.stringify(queueMessage)]);
            this.http.broadcast(messageFile);
            break;
          case 'IngestDocument':
            this._handleDocumentIngested(job.params[0]);
            const document = await this.db.select('owner','fabric_id','title').from('documents').where({ id: job.params[0] }).first();
            queueMessage.creator = document.owner;
            queueMessage.fabric_id = document.fabric_id;
            queueMessage.title = document.title;
            const messageDocument = Message.fromVector([queueMessage.type, JSON.stringify(queueMessage)]);
            this.http.broadcast(messageDocument);
            break;
          default:
            console.log('[SENSEMAKER:CORE] Unhandled complete Job Method: ', job.method);
            break;
        }
      } catch (exception) {
        console.error('[SENSEMAKER:CORE] Redis subscriber error:', exception);
      }
    }
  }

  async onJobTaken (message) {
    const { job } = JSON.parse(message);
    if (job) {
      const queueMessage = {
        job: job,
        type: 'takenJob',
      };

      const messageTook = Message.fromVector([queueMessage.type, JSON.stringify(queueMessage)]);
      this.http.broadcast(messageTook);
    }
  }

  async query (query) {
    console.debug('[SENSEMAKER:CORE]', '[QUERY]', 'Received query:', query);
    const collections = {
      courts: {}
    };

    const candidates = await Promise.allSettled([
      (new Promise((resolve, reject) => {
        setTimeout(reject, USER_QUERY_TIMEOUT_MS, new Error('Timeout!'));
      })),
      this._searchCourts(query)
    ]);

    console.debug('[SENSEMAKER:CORE]', '[QUERY]', 'Candidates:', candidates);

    return candidates;
  }

  async restore () {
    const last = await this.changes._getLastLine();
    // TODO: load from STATE file
    return this;
  }

  async ingest (data) {
    await this.queue._addJob('ingest', [data]);
  }

  async prime () {
    console.debug('[SENSEMAKER:CORE]', '[PRIME]', 'Priming...');
    for (let i = 0; i < this.settings.ollama.models.length; i++) {
      console.debug('[SENSEMAKER:CORE]', '[PRIME]', 'Priming:', this.settings.ollama.models[i]);
      const prime = await fetch(`http${(this.settings.ollama.secure) ? 's' : ''}://${this.settings.ollama.host}:${this.settings.ollama.port}/api/generate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: this.settings.ollama.models[i] })
      });

      // TODO: check for successful prime
      // console.debug('[SENSEMAKER:CORE]', '[PRIME]', 'Primed:', await prime.json());
    }
  }

  /**
   * Retrieve a file by its database ID.
   * @param {Number} id Database ID of the file.
   * @returns {Object} File object.
   */
  async retrieveFile (id) {
    const file = await this.db('files').where('id', id).first();
    const content = fs.readFileSync(file.path);
    // const actor = new Actor({ name: `sensemaker/users/${file.creator}` });

    return {
      id: file.id,
      name: file.name,
      mimetype: file.type,
      embedding_id: file.embedding_id,
      content: content.toString('utf8')
    };
  }

  async search (request) {
    console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Received search request:', request);
    const redisResults = await this.trainer.search(request);
    console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Redis Results:', redisResults);
    const documents = await this._searchDocuments(request);
    // const people = await this._searchPeople(request);

    const elements = [];

    for (let i = 0; i < documents.length; i++) {
      const instance = documents[i];
      const element = { type: 'Case', content: instance };
      elements.push(element);
    }

    // Construct Results Object
    const results = {
      request: request,
      query: request.query,
      cases: cases,
      courts: [], // TODO: implement
      documents: [], // TODO: implement
      people: [], // TODO: implement
      results: elements,
      content: elements,
      pagination: {
        total: elements.length,
        per_page: PER_PAGE_DEFAULT,
        current_page: 1,
        last_page: 1
      }
    };

    return results;
  }

  async searchConversations (request) {
    const components = request.query.split(' ');
    const tokens = this.combinationsOf(components);

    // Search for all tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const results = await this.db('messages').where('content', 'like', `%${token}%`);
      console.debug('[SENSEMAKER:CORE]', '[SEARCH]', '[CONVERSATIONS]', 'Found results:', results);
    }

    const messages = await this.db('messages').select('id').where('content', 'like', `%${request.query}%`);
    const conversations = await this.db('conversations').in('id', messages.map((message) => message.conversation_id)).paginate({
      perPage: PER_PAGE_DEFAULT,
      currentPage: 1
    });

    console.debug('[SENSEMAKER:CORE]', '[SEARCH]', '[CONVERSATIONS]', 'Found conversations:', conversations);

    // Result Constructor
    const elements = [];

    for (let i = 0; i < conversations.data.length; i++) {
      const instance = conversations[i];
      const element = { type: 'Conversation', content: instance };
      elements.push(element);
    }

    // Construct Results Object
    const results = {
      request: request,
      query: request.query,
      conversations: conversations,
      results: [],
      pagination: {
        total: elements.length,
        per_page: PER_PAGE_DEFAULT,
        current_page: 1,
        last_page: 1
      }
    };

    return results;
  }

  async secureEmbeddingsForCase (id) {
    const target = await this.db('cases').where('id', id).first();
    console.debug('secured:', target);

    // Secure Summary
    if (!target.summary) {
      console.debug('No summary found for case:', target);
      return;
    }
  }

  /**
   * Start the process.
   * @return {Promise} Resolves once the process has been started.
   */
  async start () {
    const self = this;

    // Load HTML document from disk to serve from memory
    // TODO: add filesystem watcher for live updates (low priority)
    this.applicationString = fs.readFileSync('./assets/index.html').toString('utf8');

    // Create all worker agents
    console.debug('[SENSEMAKER:CORE]', 'Creating network:', Object.keys(this.settings.agents));

    for (const [name, agent] of Object.entries(this.settings.agents)) {
      const configuration = merge({}, agent, { name: name, debug: this.settings.debug });
      console.debug('[SENSEMAKER:CORE]', 'Creating network agent:', `[${(configuration.fabric) ? 'FABRIC' : (configuration.secure) ? 'HTTPS' : 'HTTP' }]`, name, configuration.host, configuration.port, configuration.secure);
      this.agents[name] = this.createAgent(configuration);
    }

    // Worker Methods
    // TODO: define these with a map / loop
    // Document Ingest
    /* this.queue._registerMethod('IngestDocument', async (...params) => {
      console.debug('[SENSEMAKER:CORE]', '[QUEUE]', 'Ingesting document...', params);
      const document = await this.db('documents').where('id', params[0]).first();
      const ingested = await this.trainer.ingestDocument({ content: JSON.stringify(document.content), metadata: { id: document.id }}, 'document');
      return { status: 'COMPLETED', ingested };
    }); */

    // User Upload Ingest
    this.queue._registerMethod('IngestFile', IngestFile.bind(this), this);

    // Trainer
    this.trainer.attachDatabase(this.db);

    try {
      await this.trainer.start();
    } catch (exception) {
      console.error('[SENSEMAKER:CORE]', '[REDIS]', 'Error starting Trainer:', exception);
      process.exit();
    }

    // Redis client for subscribing to channels
    const redisSubscriber = createClient({
      username: this.settings.redis.username,
      password: this.settings.redis.password,
      socket: this.settings.redis
    });

    function updateAPI (job, result) {
      console.log(`Updating API for job ${job} with job ID: ${job.id} with result:`, result);

      const fileUploadMessage = {
        sender: 'req.user.id',
        creator: true,
        content: 'content',
        conversation_id: 'conversation_id',
        help_role: 'help_role',
      }

      fileUploadMessage.type = 'FileUploadMsg';

      //here we broadcast the message, telling 'Bridge.js' which role sent a message
      const message = Message.fromVector([fileUploadMessage.type, JSON.stringify(fileUploadMessage)]);
      this.http.broadcast(message);
    }

    redisSubscriber.connect().then(() => {
      redisSubscriber.subscribe('job:completed', this.onJobCompleted.bind(this));
      redisSubscriber.subscribe('job:taken', this.onJobTaken.bind(this));
    });

    // Queue
    try {
      await this.queue.start();
    } catch (exception) {
      console.error('[SENSEMAKER:CORE]', '[REDIS]', 'Error starting Redis Queue:', exception);
      process.exit();
    }

    // Action Model
    try {
      await this.coordinator.start();
    } catch (exception) {
      console.error('[SENSEMAKER:CORE]', '[COORDINATOR]', 'Error starting Coordinator:', exception);
    }

    // Redis Cache
    try {
      await this.redis.connect();
    } catch (exception) {
      console.error('[SENSEMAKER:CORE]', '[REDIS]', 'Error starting Redis Cache:', exception);
      process.exit();
    }

    /* this.db.on('error', (...error) => {
      console.error('[SENSEMAKER:CORE]', '[DB]', '[ERROR]', ...error);
    }); */

    // Register Services
    // await this._registerService('webhooks', WebHooks);
    await this._registerService('bitcoin', Bitcoin);
    // await this._registerService('discord', Discord);
    // await this._registerService('github', GitHub);
    await this._registerService('matrix', Matrix);
    // await this._registerService('twilio', Twilio);
    // await this._registerService('twitter', Twitter);
    // await this._registerService('pricefeed', Prices);

    // this.products = await this.stripe.enumerateProducts();

    // if (this.settings.statutes.enable && this.statutes) {
    //   this.statutes.start().then((output) => {
    //     console.debug('[SENSEMAKER:CORE]', '[STATUTES]', 'Started:', output);
    //   });
    // }

    // Primary Worker
    // Job Types
    this.worker.register('ScanLocal', async (...params) => {
      console.debug('[WORKER]', 'Scanning Local:', params);
      const state = this.fs.sync();
      console.debug('[WORKER]', 'Local State:', state);
    });

    this.worker.register('ScanRemotes', async (...params) => {
      console.debug('[WORKER]', 'Scanning Remotes:', params);
    });

    // Worker Events
    this.worker.on('debug', (...debug) => console.debug(...debug));
    this.worker.on('log', (...log) => console.log(...log));
    this.worker.on('warning', (...warning) => console.warn(...warning));
    this.worker.on('error', (...error) => console.error(...error));

    // Email Events
    if (this.email) {
      this.email.on('debug', (...debug) => console.debug('[EMAIL]', ...debug));
      this.email.on('log', (...log) => console.log('[EMAIL]', ...log));
      this.email.on('warning', (...warning) => console.warn('[EMAIL]', ...warning));
      this.email.on('error', (...error) => console.error('[EMAIL]', ...error));
    }

    // Fabric Events
    this.fabric.on('error', this._handleFabricError.bind(this));
    // this.fabric.on('warning', (...warning) => console.warn(...warning));
    this.fabric.on('debug', this._handleFabricDebug.bind(this));
    this.fabric.on('log', (...log) => console.log(...log));

    // Collect Sensemaker-specific
    // Courts
    this.fabric.on('document', this._handleFabricDocument.bind(this));
    this.fabric.on('person', this._handleFabricPerson.bind(this));

    // Matrix Events
    if (this.matrix) {
      this.matrix.on('activity', this._handleMatrixActivity.bind(this));
      this.matrix.on('ready', this._handleMatrixReady.bind(this));
      this.matrix.on('error', this._handleMatrixError.bind(this));
    }

    if (this.discord) {
      this.discord.on('activity', this._handleDiscordActivity.bind(this));
      this.discord.on('ready', this._handleDiscordReady.bind(this));
      this.discord.on('error', this._handleDiscordError.bind(this));
      this.discord.on('log', this._handleDiscordLog.bind(this));
      this.discord.on('debug', this._handleDiscordDebug.bind(this));
    }

    // OpenAI Events
    this.openai.on('error', this._handleOpenAIError.bind(this));
    this.openai.on('MessageStart', this._handleOpenAIMessageStart.bind(this));
    this.openai.on('MessageChunk', this._handleOpenAIMessageChunk.bind(this));
    this.openai.on('MessageEnd', this._handleOpenAIMessageEnd.bind(this));
    this.openai.on('MessageWarning', this._handleOpenAIMessageWarning.bind(this));

    // Retrieval Augmentation Generator (RAG)
    this.augmentor = new Agent({ name: 'AugmentorAI', listen: false, model: this.settings.ollama.model, host: this.settings.ollama.host, secure: this.settings.ollama.secure, port: this.settings.ollama.port, openai: this.settings.openai, prompt: 'You are AugmentorAI, designed to augment any input as a prompt with additional information, using a YAML header to denote specific properties, such as collection names.' });
    this.summarizer = new Agent({ name: this.settings.name, listen: false, model: this.settings.ollama.model, host: this.settings.ollama.host, secure: this.settings.ollama.secure, port: this.settings.ollama.port, prompt: this.prompt, /* ...this.settings.gemini,  */openai: this.settings.openai });

    // ChatGPT
    this.chatgpt = new Agent({ name: 'GPT4', host: null, model: this.settings.openai.model, prompt: this.prompt, rules: this.settings.rules, openai: this.settings.openai });

    // RAG, Augmentor
    const documentDef = await this.db.raw(`SHOW CREATE TABLE documents`);

    // TODO: allow configurable whitelist
    this.rag = new Agent({
      name: 'AugmentorRAG',
      listen: this.settings.fabric.listen,
      host: null,
      openai: this.settings.openai,
      prompt: 'You are AugmentorRAG, designed to create SQL queries which will return the most relevant results to the user\'s query.  You must not use any UPDATE or DELETE queries; ONLY use the SELECT command.  You can use JOIN to create a unified data view, but be sure that the user query and conversation history are considered carefully to generate the most relevant results.\n\n' +
        'Supported tables:\n' +
        '  - documents\n' +
        'Schema definitions:\n' +
        '```\n' +
        documentDef[0][0]['Create Table'] + '\n' +
        '```\n\n' +
        'Supported paths:\n' +
        '  - / (index, all object types)\n' +
        '  - /documents (document database)\n' +
        '\nOnly ever return a raw SQL query, to be executed by the caller.  Do not return any other content, such as Markdown or JSON.  Remember, your response will be executed directly by a SQL client, so ensure it is a valid query given the schema.\n' +
        '\nFor example, if the user asks "How many documents are in the database?" you would respond with "SELECT count(id) as document_count FROM documents;" as an optimized query.'
    });

    this.rag.on('debug', (...debug) => console.debug('[RAG]', ...debug));
    this.rag.on('log', (...log) => console.log('[RAG]', ...log));
    this.rag.on('warning', (...warning) => console.warn('[RAG]', ...warning));
    this.rag.on('error', (...error) => console.error('[RAG]', ...error));
    this.rag.on('query', this._handleRAGQuery.bind(this));

    // Load models
    await this.searcher.start()
    await this.alpha.start();
    // await this.beta.start();
    await this.llama.start();
    await this.augmentor.start();
    await this.summarizer.start();
    await this.rag.start();

    try {
      await this.prime();
    } catch (exception) {
      console.error('[SENSEMAKER:CORE]', 'Error priming:', exception);
    }

    // Start the logging service
    await this.audits.start();
    await this.changes.start();

    // Load State
    await this.restore();

    // Internal Services
    await this.fabric.start();
    if (this.email) await this.email.start();
    if (this.matrix) await this.matrix.start();
    // if (this.github) await this.github.start();
    if (this.discord) {
      try {
        await this.discord.start();
      } catch (exception) {
        console.error('[SENSEMAKER:CORE]', '[DISCORD]', 'Error starting Discord:', exception);
      }
    }

    // Debug Services
    // await this.rag.start();

    // AI Services
    // await this.rag.start();
    await this.openai.start();

    // Record all future activity
    this.on('commit', async function _handleInternalCommit (commit) {
      await self.audits.log(commit);
      // self.alert('Commitment: \n```\n' + JSON.stringify(commit, null, '  ') + '\n```');
    });

    // TODO: remove
    this.on('block', async function (block) {
      self.emit('log', `Proposed Block: ${JSON.stringify(block, null, '  ')}`);
    });

    // Sandbox
    // await this.sandbox.start();

    // Worker
    await this.worker.start();

    if (this.settings.crawl) {
      this._crawler = setInterval(async () => {
        /* this.worker.addJob({
          type: 'ScanRemotes',
          params: []
        }); */
      }, this.settings.crawlDelay);
    }

    this._slowcrawler = setInterval(async () => {
      // Sync Health First
      // const health = await this.checkHealth();
      // console.debug('[SENSEMAKER:CORE]', 'Health:', health);

      /* this.worker.addJob({ type: 'DownloadMissingDocument', params: [] }); */
      if (this.settings.embeddings.enable) {
        /* this._syncEmbeddings(SYNC_EMBEDDINGS_COUNT).then((output) => {
          console.debug('[SENSEMAKER:CORE]', 'Embedding sync complete:', output);
        }); */
      }
    }, SNAPSHOT_INTERVAL); // 10 minutes

    // Internal APIs
    // Counts
    this.http._addRoute('HEAD', '/people', async (req, res) => {
      const count = await this.db('people').count('id as count').first();
      res.set('X-Count', count.count);
      res.send();
    });

    this.http._addRoute('HEAD', '/documents', async (req, res) => {
      const count = await this.db('documents').count('id as count').first();
      res.set('X-Count', count.count);
      res.send();
    });

    // API
    this.http._addRoute('POST', '/v1/chat/completions', this._handleChatCompletionRequest.bind(this));

    // Search
    // TODO: test each search endpoint
    // - [ ] /
    // - [ ] /documents
    // - [ ] /conversations
    // - [ ] /people
    this.http._addRoute('SEARCH', '/', this._handleGenericSearchRequest.bind(this));
    this.http._addRoute('SEARCH', '/documents', ROUTES.documents.search.bind(this));
    this.http._addRoute('SEARCH', '/conversations', this._handleConversationSearchRequest.bind(this));
    this.http._addRoute('SEARCH', '/people', this._handlePeopleSearchRequest.bind(this));

    // Health
    this.http._addRoute('GET', '/metrics/health', this._handleHealthRequest.bind(this));

    // Agents
    this.http._addRoute('GET', '/agents', ROUTES.agents.list.bind(this));

    // Files
    this.http.express.post('/files', this.uploader.single('file'), this._userMiddleware.bind(this), ROUTES.files.create.bind(this));
    // this.http._addRoute('GET', '/files/serve/:id', this._userMiddleware.bind(this), ROUTES.files.serve.bind(this));
    this.http._addRoute('GET', '/files/serve/:id', ROUTES.files.serve.bind(this));
    this.http._addRoute('GET', '/files', ROUTES.files.list.bind(this));
    this.http._addRoute('GET', '/files/user/:id', ROUTES.files.list.bind(this));
    this.http._addRoute('GET', '/files/:id', ROUTES.files.view.bind(this));
    this.http._addRoute('GET', '/files/find/:filename', ROUTES.files.find.bind(this));

    // Uploads
    this.http._addRoute('GET', '/uploads', ROUTES.uploads.listUploads.bind(this));

    // Products
    this.http._addRoute('GET', '/products', ROUTES.products.list.bind(this));

    // Documents
    this.http._addRoute('POST', '/documents', ROUTES.documents.create.bind(this));
    this.http._addRoute('POST', '/documents/:fabricID/section/:id', ROUTES.documents.createSection.bind(this));
    this.http._addRoute('PATCH', '/documents/:fabricID/section/delete/:id', ROUTES.documents.deleteSection.bind(this));
    this.http._addRoute('PATCH', '/documents/:fabricID/section/:id', ROUTES.documents.editSection.bind(this));
    this.http._addRoute('GET', '/documents/:fabricID', ROUTES.documents.view.bind(this));
    this.http._addRoute('GET', '/documents/sections/:fabricID', ROUTES.documents.getSections.bind(this));
    this.http._addRoute('PATCH', '/documents/:fabricID', ROUTES.documents.edit.bind(this));
    this.http._addRoute('PATCH', '/documents/delete/:fabricID', ROUTES.documents.delete.bind(this));
    this.http._addRoute('GET', '/conversations/documents/:id', ROUTES.documents.newConversation.bind(this));

    // Users
    this.http._addRoute('GET', '/users', ROUTES.users.list.bind(this));
    this.http._addRoute('GET', '/users/:username', ROUTES.users.view.bind(this));
    // TODO: switch to PATCH `/users/:username`
    this.http._addRoute('PATCH', '/users/username', ROUTES.users.editUsername.bind(this)); //this one is for admin to change other user's username
    this.http._addRoute('PATCH', '/users/email', ROUTES.users.editEmail.bind(this)); //this one is for admin to change other user's email

    // Services
    this.http._addRoute('POST', '/services/feedback', this._handleFeedbackRequest.bind(this));
    this.http._addRoute('GET', '/services/discord/authorize', this._handleDiscordAuthorizeRequest.bind(this));
    this.http._addRoute('GET', '/services/discord/revoke', this._handleDiscordRevokeRequest.bind(this));

    // Feedback
    this.http._addRoute('POST', '/feedback', ROUTES.feedback.create.bind(this));

    // Help chat
    this.http._addRoute('GET', '/conversations/help', ROUTES.help.getConversations.bind(this));
    this.http._addRoute('GET', '/conversations/help/admin', ROUTES.help.getAdmConversations.bind(this));
    this.http._addRoute('GET', '/messages/help/:conversation_id', ROUTES.help.getMessages.bind(this));
    this.http._addRoute('POST', '/messages/help/:conversation_id', ROUTES.help.sendMessage.bind(this));
    this.http._addRoute('PATCH', '/messages/help/:conversation_id', ROUTES.help.setMessagesRead.bind(this));

    //Redis clientside connections
    this.http._addRoute('GET', '/redis/queue', ROUTES.redis.listQueue.bind(this));
    this.http._addRoute('PATCH', '/redis/queue', ROUTES.redis.clearQueue.bind(this));

    // TODO: move all handlers to class methods
    this.http._addRoute('POST', '/inquiries', this._handleInquiryCreateRequest.bind(this));
    this.http._addRoute('GET', '/inquiries', this._handleInquiryListRequest.bind(this));

    //endpoint to delete inquiry from admin panel
    this.http._addRoute('PATCH', '/inquiries/delete/:id', async (req, res) => {
      const inquiryID = req.params.id;
      try {
        const inquiry = await this.db.select('*').from('inquiries').where({ id: inquiryID }).first();

        if (!inquiry) {
          return res.status(404).json({ message: 'Invalid inquiry' });
        }

        // update the invitation status to deleted from the invitations list
        const inquiryDeleteStatus = await this.db('inquiries')
          .where({ id: inquiryID })
          .update({
            updated_at: new Date(),
            status: 'deleted',
          });

        if (!inquiryDeleteStatus) {
          return res.status(500).json({ message: 'Error deleting the invitation.' });
        }

        res.send({
          message: 'Invitation deleted successfully!'
        });

      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }

    });

    this.http._addRoute('GET', '/signup/:invitationToken', async (req, res, next) => {
      return res.send(this.http.app.render());
    });
    this.http._addRoute('GET', '/signup/decline/:invitationToken', async (req, res, next) => {
      return res.send(this.http.app.render());
    });

    //this endpoint creates the invitation and sends the email, for new invitations comming from inquiries
    this.http._addRoute('POST', '/invitations', ROUTES.invitations.createInvitations.bind(this) );

    //this endponint resends invitations to the ones created before
    this.http._addRoute('PATCH', '/invitations/:id', ROUTES.invitations.resendInvitation.bind(this));


    this.http._addRoute('GET', '/invitations/:id', async (req, res) => {
      // TODO: render page for accepting invitation
      // - create user account
      // - set user password
      // - create help conversation
    });

    this.http._addRoute('GET', '/invitations', ROUTES.invitations.getInvitations.bind(this));
    this.http._addRoute('POST', '/checkInvitationToken/:id',ROUTES.invitations.checkInvitationToken.bind(this));

    //endpoint to change the status of an invitation when its accepted
    this.http._addRoute('PATCH', '/invitations/accept/:id', ROUTES.invitations.acceptInvitation.bind(this));

    //endpoint to change the status of an invitation when its declined
    this.http._addRoute('PATCH', '/invitations/decline/:id', ROUTES.invitations.declineInvitation.bind(this));

    //endpoint to delete invitation from admin panel
    this.http._addRoute('PATCH', '/invitations/delete/:id', ROUTES.invitations.deleteInvitation.bind(this));

    this.http._addRoute('POST', '/users', ROUTES.users.createUser.bind(this));

    this.http._addRoute('POST', '/users/full',ROUTES.users.createFullUser.bind(this));

    //endpoint to check if the username is available
    this.http._addRoute('POST', '/users/:id', ROUTES.users.checkExistingUsername.bind(this));

    //endpoint to check if the email is available
    this.http._addRoute('POST', '/users/email/:id', ROUTES.users.checkExistingEmail.bind(this));
    this.http._addRoute('GET', '/sessions', ROUTES.sessions.get.bind(this));

    // TODO: change to /sessions
    this.http._addRoute('GET', '/sessions/new', async (req, res, next) => {
      return res.redirect('/sessions');
    });

    this.http._addRoute('GET', '/passwordreset/:token', async (req, res, next) => {
      return res.send(this.http.app.render());
    });

    this.http._addRoute('POST', '/sessions', ROUTES.sessions.create.bind(this));
    this.http._addRoute('GET', '/sessions/current', async (req, res, next) => {
      let identity = null;
      try {
        const user = await this.db('users').where('id', req.user.id).first();
        if (!user) {
          return res.status(401).json({ message: 'Invalid session.' });
        }

        if (user.discord_id) {
          identity = await this.db('identities').where('user_id', req.user.id).where('type', 'DiscordUsername').first();
        }

        return res.json({
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin,
          isBeta: user.is_beta,
          isCompliant: user.is_compliant,
          user_discord: (identity) ? {
            id: user.discord_id,
            username: identity.content,
          } : undefined,
          id: user.id
        });
      } catch (error) {
        console.error('Error authenticating user: ', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    this.http._addRoute('POST', '/passwordChange', ROUTES.account.changePassword.bind(this));
    this.http._addRoute('POST', '/usernameChange', ROUTES.account.changeUsername.bind(this));
    this.http._addRoute('POST', '/passwordReset', async (req, res, next) => {
      const { email } = req.body;

      try {
        // Check if the email exists
        const existingUser = await this.db('users').where('email', email).first();
        if (!existingUser) {
          return res.status(409).json({
            message: 'This email you entered is not assigned to a registered user. Please check and try again or contact client services on support@sensemaker.io'
          });
        }

        // Generate a unique token
        let uniqueTokenFound = false;
        let resetToken = '';
        while (!uniqueTokenFound) {
          resetToken = crypto.randomBytes(20).toString('hex');
          const tokenExists = await this.db.select('*').from('password_resets').where({ token: resetToken }).first();
          if (!tokenExists) {
            uniqueTokenFound = true;
          }
        };

        const newReset = await this.db('password_resets').insert({
          user_id: existingUser.id,
          token: resetToken,
        });
        //Flag for Eric
        //We have to change the resetLink when it goes to the server so it redirects to the right hostname
        //We have to upload the image somwhere so it can be open in the email browser, right now its in a firebasestoreage i use to test

        const resetLink = `${this.authority}/passwordreset/${resetToken}`;
        const imgSrc = "https://sensemaker.io/images/sensemaker-icon.png";
        const htmlContent = this.createPasswordResetEmailContent(resetLink,imgSrc);

        try {
          await this.email.send({
            from: 'agent@sensemaker.io',
            to: email,
            subject: 'Password Reset',
            html: htmlContent
          });

          return res.json({
            message: 'Token sent successfully.',
          });
        } catch (error) {
          console.error('Error sending email', error);
          return res.status(500).json({
            message: 'Email could not be sent. Please try again later or contact client services on support@sensemaker.io'
          });
        }
      } catch (error) {
        console.error('Error processing request', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    //function to check if the reset token for password is valid
    this.http._addRoute('POST', '/resettokencheck', async (req, res, next) => {
      const { resetToken } = req.body;

      try {
        // Check if the token exists

        const existingToken = await this.db('password_resets').where('token', resetToken).orderBy('id', 'desc').first();

        if (!existingToken) {
          return res.status(409).json({
            message: 'Your reset link is not valid, please try reseting your password again'
          });
        }
        // Check if the token is older than 1 hour
        const tokenAge = new Date() - new Date(existingToken.created_at);
        const oneHour = 1000 * 60 * 60; // milliseconds in one hour

        if (tokenAge > oneHour) {
          return res.status(410).json({ // 410 Gone is often used for expired resources
            message: 'Your reset token has expired, please request a new one.'
          });
        }

        return res.json({
          message: 'Token correct.',
        });
      } catch (error) {
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    //this is the function that updates the password of the user that came with a reset token
    this.http._addRoute('POST', '/passwordRestore', async (req, res, next) => {
      const { newPassword, resetToken } = req.body;

      try {
        const userReseting = await this.db('password_resets').where('token', resetToken).orderBy('id', 'desc').first();
        if (!userReseting) {
          return res.status(401).json({ message: 'Invalid reset token.' });
        }

        // Generate a salt and hash the new password
        const saltRounds = 10;
        const salt = genSaltSync(saltRounds);
        const hashedPassword = hashSync(newPassword, salt);

        // Update the user's password in the database
        await this.db('users').where('id', userReseting.user_id).update({
          password: hashedPassword,
          salt: salt
        });

        return res.json({
          message: 'Password updated successfully.',
        });
      } catch (error) {
        console.error('Error authenticating user: ', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    // TODO: check logic of PATCH, any other routes conflict?
    // route to edit a conversation title
    this.http._addRoute('PATCH', '/conversations/:id', ROUTES.conversations.editConversationsTitle.bind(this));

    this.http._addRoute('GET', '/statistics', async (req, res, next) => {
      const inquiries = await this.db('inquiries').select('id');
      const invitations = await this.db('invitations').select('id').from('invitations');
      const stats = {
        ingestions: {
          remaining: 0,
          complete: 0
        },
        inquiries: {
          total: inquiries.length
        },
        invitations: {
          total: invitations.length
        }
      };

      res.send(stats);
    });

    this.http._addRoute('GET', '/conversations', ROUTES.conversations.getConversations.bind(this));
    this.http._addRoute('GET', '/people', ROUTES.people.list.bind(this));
    this.http._addRoute('GET', '/people/:fabricID', async (req, res, next) => {
      const person = await this.db.select(
        'id as dbid',
        'fabric_id as id',
        'full_name',
        'name_first',
        'name_middle',
        'name_last',
        'name_suffix',
        'date_of_birth',
        'date_of_death',
        'courtlistener_id'
      ).from('people').orderBy('name', 'asc').where({ fabric_id: req.params.fabricID }).first();

      res.format({
        json: () => {
          if (!person) return res.status(404).json({ message: 'Person not found.' });
          res.send(person);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/documents', ROUTES.documents.list.bind(this));
    this.http._addRoute('GET', '/messages', ROUTES.messages.getMessages.bind(this));
    this.http._addRoute('GET', '/conversations/:id', ROUTES.conversations.getConversationsByID.bind(this));

    this.http._addRoute('GET', '/contracts/terms-of-use', async (req, res, next) => {
      const contract = fs.readFileSync('./contracts/terms-of-use.md').toString('utf8');
      res.send({
        content: contract
      });
    });

    this.http._addRoute('GET', '/statistics/admin', async (req, res, next) => {
      const current = await this._getState();
      const waiting = await this.db('invitations').count('id as count').where({ status: 'waiting' }).first();
      current.inquiries.waiting = waiting.count;
      res.send(current);
    });

    this.http._addRoute('GET', '/statistics/accuracy', async (req, res, next) => {
      const reviews = await this.db('reviews').whereNotNull('id');
      const response = {
        accuracy: {
          positive: 0,
          negative: 0,
          neutral: 0
        },
        total: reviews.length
      };

      for (let review of reviews) {
        switch (review.intended_sentiment) {
          case 'positive':
            response.accuracy.positive++;
            break;
          case 'negative':
            response.accuracy.negative++;
            break;
          default:
            response.accuracy.neutral++;
            break;
        }
      }

      res.send(response);
    });

    this.http._addRoute('GET', '/statistics/sync', async (req, res, next) => {
      const current = await this._getState();
      const state = {
        current: current,
        datasources: {}
      };

      for (let [name, datasource] of Object.entries(this.datasources)) {
        let source = { name: datasource.name };
        switch (name) {
          case 'discord':
            if (this.pacer) source.counts = await this.discord.getCounts();
            break;
          case 'matrix':
            if (this.pacer) source.counts = await this.matrix.getCounts();
            break;
          default:
            console.warn('[SENSEMAKER:CORE]', 'Unhandled Datasource:', name);
            break;
        }

        state.datasources[name] = source.counts;
      }

      res.send(state);
    });

    this.http._addRoute('GET', '/settings', async (req, res, next) => {
      res.format({
        json: () => {
          return res.send({
            name: this.name,
            version: this.version
          });
        },
        html: () => {
          return res.send(this.applicationString);
        }
      })
    });

    this.http._addRoute('GET', '/settings/admin', async (req, res, next) => {
      res.format({
        json: () => {
          return res.send({
            name: this.name,
            version: this.version
          });
        },
        html: () => {
          return res.send(this.applicationString);
        }
      })
    });

    // TODO: revert these routes
    this.http._addRoute('GET', '/settings/admin/Overview', ROUTES.adminSettings.overview.bind(this));
    this.http._addRoute('GET', '/settings/admin/Settings', ROUTES.adminSettings.settings.bind(this));
    this.http._addRoute('GET', '/settings/admin/Users', ROUTES.adminSettings.users.bind(this));
    this.http._addRoute('GET', '/settings/admin/Growth', ROUTES.adminSettings.growth.bind(this));
    this.http._addRoute('GET', '/settings/admin/Conversations', ROUTES.adminSettings.conversations.bind(this));
    this.http._addRoute('GET', '/settings/admin/Services', ROUTES.adminSettings.services.bind(this));
    this.http._addRoute('GET', '/settings/admin/Design', ROUTES.adminSettings.design.bind(this));

    this.http._addRoute('PATCH', '/settings/compliance', async (req, res, next) => {
      let result = {};

      console.debug('[COMPLIANCE]', 'Signer', req.user.id, 'signed Terms of Use');

      if (req.user.id) {
        await this.db('users').update({
          is_compliant: true
        }).where({
          id: req.user.id
        });

        result.message = 'Update complete.';
        result.isCompliant = true;
      } else {
        result.message = 'Failed.'
      }

      res.send(result);
    });

    this.http._addRoute('POST', '/reviews', async (req, res, next) => {
      // TODO: check token
      const request = req.body;

      try {
        await this.db('reviews').insert({
          creator: req.user.id,
          rating: request.rating,
          comment: request.comment,
          intended_sentiment: (request.thumbsUpClicked) ? 'positive' : 'negative',
          message_id: request.message
        });

        return res.send({
          type: 'ReviewMessageResult',
          content: {
            message: 'Success!',
            status: 'success'
          }
        });
      } catch (exception) {
        return res.send({
          type: 'ReviewMessageError',
          content: exception
        });
      }
    });

    this.http._addRoute('POST', '/messages', ROUTES.messages.create.bind(this));

    // TODO: attach old message ID to a new message ID, send `regenerate_requested` to true
    this.http._addRoute('PATCH', '/messages/:id', async (req, res, next) => {
      let subject = null;
      let {
        case_id,
        conversation_id,
        content,
        messageID,
        regenerate,
        matter_id,
        file_fabric_id,
      } = req.body;

      if (!regenerate) console.warn('[SENSEMAKER:CORE]', '[WARNING]', 'PATCH /messages/:id called without `regenerate` flag.  This is a destructive operation.');

      const old_message = await this.db('messages').where({ id: req.params.id }).first();
      console.debug('old message:', old_message);

      if (!old_message) return res.status(404).json({ message: 'Message not found.' });
      // TODO: update message graph; consider requests, responses
      // flag message as regenerated
      // point to new answer
      // confirm acceptance of new answer

      try {
        const conversation = await this.db('conversations').where({ id: conversation_id }).first();
        if (!conversation) throw new Error(`No such Conversation: ${conversation_id}`);

        const newRequest = await this.db('requests').insert({
          message_id: messageID
        });

        this._handleRequest({
          // actor: activity.actor,
          conversation_id: conversation_id,
          subject: (subject) ? `${subject.title}, ${subject.court_name}, ${subject.decision_date}` : null,
          input: content,
        }).then((output) => {
//           console.log('got request output:', output);
//           this.db('responses').insert({
//             content: output.object.content
//           });

//           this.db('messages').insert({
//             content: output.object.content,
//             conversation_id: conversation_id,
//             user_id: 1 // TODO: real user ID
//           }).then(async (response) => {
//             console.log('response created:', response);

//             if (isNew) {
//               const messages = await this._getConversationMessages(conversation_id);
//               const title = await this._summarizeMessagesToTitle(messages.map((x) => {
//                 return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
//               }));

//               await this.db('conversations').update({ title }).where({ id: conversation_id });
//             }
//           });
        });

        if (!conversation.log) conversation.log = [];
        if (typeof conversation.log == 'string') {
          conversation.log = JSON.parse(conversation.log);
        }

        // Attach new message to the conversation
       // conversation.log.push(newMessage[0]);

        await this.db('conversations').update({
          log: JSON.stringify(conversation.log)
        }).where({
          id: conversation_id
        });

        return res.json({
          message: 'Message sent.',
          object: {
            id: messageID,
            conversation: conversation_id
          }
        });
      } catch (error) {
        console.error('ERROR:', error);
        this.emit('error', `Failed to create message: ${error}`);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    this.http._addRoute('POST', '/announcements', async (req, res, next) => {
      if (!req.user || !req.user.state?.roles?.includes('admin')) {
        return res.status(401).json({ message: 'Unauthorized.' });
      }

      const request = req.body;

      try {
        await this.db('announcements').insert({
          creator_id: req.user.id,
          title: (request.title) ? request.title : null,
          body: request.body,
          expiration_date: (request.expirationDate) ? request.expirationDate : null,
        });

        return res.send({
          type: 'announcementCreated',
          content: {
            message: 'Success!',
            status: 'success'
          }
        });
      } catch (exception) {
        return res.send({
          type: 'announcementError',
          content: exception
        });
      }
    });

    this.http._addRoute('GET', '/announcements', async (req, res, next) => {
      try {
        const announcements = await this.db('announcements')
          .select('*')
          .orderBy('created_at', 'desc');

        res.json(announcements);
      } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ message: 'Internal server error.' });
      }
    });

    this.http._addRoute('GET', '/announcements/latest', async (req, res, next) => {
      try {
        const latestAnnouncement = await this.db('announcements')
          .select('*')
          .orderBy('created_at', 'desc')
          .first();

        if (!latestAnnouncement) {
          return res.status(404).json({ message: 'No announcement found.' });
        }

        res.json(latestAnnouncement);
      } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ message: 'Internal server error.' });
      }
    });

    // await this._startAllServices();

    // Listen for HTTP events, if enabled
    if (this.settings.http.listen) this.trust(this.http);

    // Always trust the local agent
    this.trust(this.agent);

    // Queue up a verification job
    // this.queue._addJob({ method: 'verify', params: [] });

    // Create a heartbeat
    this._heart = setInterval(this.tick.bind(this), this.settings.interval);

    // Start HTTP, if enabled
    if (this.settings.http.listen) await this.http.start();
    if (this.settings.verify) await this._runFixtures();

    // GraphQL
    /* this.apollo.applyMiddleware({
      app: this.http.express,
      path: '/services/graphql'
    }); */

    // Fabric Network
    // await this.agent.start();

    // Set status...
    this.status = 'started';

    // Commit to change
    await this.commit();

    // Emit log events
    this.emit('log', '[SENSEMAKER:CORE] Started!');
    this.emit('debug', `[SENSEMAKER:CORE] Services available: ${JSON.stringify(this._listServices(), null, '  ')}`);
    this.emit('debug', `[SENSEMAKER:CORE] Services enabled: ${JSON.stringify(this.settings.services, null, '  ')}`);

    // Emit ready event
    this.emit('ready');

    // DEBUG
    this.alert(`Sensemaker started.  Agent ID: ${this.id}`);

    // Benchmarking
    if (this.settings.benchmark) {
      return this.stop();
    }

    // return the instance!
    return this;
  }

  //function that creates the template to email invitations sendig
  createInvitationEmailContent (acceptLink, declineLink, imgSrc) {
    return `
          <html>
            <body>
              <div>
                <h3>Hello, You have been invited to join Sensemaker.</h3>
                <a href=${acceptLink} class="button" target="_blank">Join Sensemaker</a>
                <p>If you prefer not to receive future invitations, <a href=${declineLink} class="decline">click here</a>.</p>
              </div>
            </body>
          </html>`;
  }

  createPasswordResetEmailContent (resetLink, imgSrc) {
    return `
        <html>
          <head>
            <body>
              <div>
                <h3>Password Reset Request</h3>
                <p>You have requested to reset your password.  Please click the button below to set a new password.</p>
                <a href=${resetLink} class="button" target="_blank">Reset Password</a>
                <p>If you did not request a password reset, please ignore this email.</p>
              </div>
          </body>
        </html>`;
  }

  /**
   * Stop the process.
   * @return {Promise} Resolves once the process has been stopped.
   */
  async stop () {
    this.status = 'STOPPING';

    // Stop HTTP Listener
    if (this.settings?.http) await this.http.destroy();
    if (this.settings?.http?.wss) await this.http.wss.destroy();
    // if (this.settings?.http) await this.http.stop();

    // Stop Fabric Listener
    if (this.agent) await this.agent.stop();

    // Stop the Worker
    if (this.worker) await this.worker.stop();
    if (this.trainer) await this.trainer.stop();

    /* console.debug('workers:', this.workers);

    for (let i = 0; i < this.workers.length; i++) {
      await this.workers[i].stop();
    } */

    // Stop Heartbeat, Crawler
    if (this._heart) clearInterval(this._heart);
    if (this._crawler) clearInterval(this._crawler);

    // Stop Services
    for (const [name, service] of Object.entries(this.services || {})) {
      if (this.settings.services.includes(name)) {
        await this.services[name].stop();
      }
    }

    // Write
    // await this.commit();

    if (this.courtlistener) await this.courtlistener.stop();
    if (this.openai) await this.openai.stop();
    if (this.matrix) await this.matrix.stop();
    if (this.email) await this.email.stop();

    // Notify
    this.status = 'STOPPED';
    this.emit('stopped', {
      id: this.id
    });

    // why();

    // TODO: troubleshoot why this is necessary (use `why()` above)
    process.exit();

    return this;
  }

  async sync () {
    await this.fs.sync();
    return this;
  }

  async _attachWorkers () {
    for (let i = 0; i < this.settings.workers; i++) {
      const worker = new Worker();
      this.workers.push(worker);
    }
  }

  async _handleChatCompletionRequest (req, res, next) {
    const request = req.body;
    console.debug('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Chat completion request:', request);
    const network = Object.keys(this.agents).map((agent) => {
      console.debug('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Sending request to agent:', agent, this.agents[agent]);
      return this.agents[agent].query(request);
    });

    Promise.race(network).catch((error) => {
      console.error('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error.', error: error });
    }).then((results) => {
      console.debug('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Chat completion results:', results);
      const object = {
        object: 'chat.completion',
        created: Date.now() / 1000,
        model: request.model || 'sensemaker',
        system_fingerprint: 'net_sensemaker',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: results.content
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      }

      const actor = new Actor(object);
      const output = merge({}, object, { id: actor.id });

      res.json(output);
    });
  }

  async _handleFeedbackRequest (req, res, next) {
    // TODO: check token
    const request = req.body;

    try {
      await this.db('feedback').insert({
        creator: req.user.id,
        content: request.comment
      });

      return res.send({
        type: 'SubmitFeedbackResult',
        content: {
          message: 'Success!',
          status: 'success'
        }
      });
    } catch (exception) {
      return res.send({
        type: 'SubmitFeedbackError',
        content: exception
      });
    }
  }

  async _handleGenericSearchRequest (req, res, next) {
    const request = req.body;
    console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Generic search request:', request);

    this.search(request).then((results) => {
      console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Results:', results);

      res.setHeader('X-Fabric-Type', 'SearchResults');
      res.setHeader('X-Pagination', true);
      res.setHeader('X-Pagination-Current', `${results.pagination.from}-${results.pagination.to}`);
      res.setHeader('X-Pagination-Per', results.pagination.per_page);
      res.setHeader('X-Pagination-Total', results.pagination.total);

      res.json({
        status: 'success',
        message: 'Results retrieved successfully.',
        results: results
      });
    });
  }

  async _handleInquiryListRequest (req, res, next) {
    res.format({
      json: async () => {
        if (!req.user || !req.user.state || !req.user.state.roles.includes('admin')) return res.status(401).json({ message: 'Unauthorized.' });

        try {
          const inquiries = await this.db('inquiries')
            .select('*')
            .orderBy('created_at', 'desc');
          res.send(inquiries);
        } catch (error) {
          console.error('Error fetching inquiries:', error);
          res.status(500).json({ message: 'Internal server error.' });
        }
      },
      html: () => {
        return res.send(this.applicationString);
      }
    });
  }

  async _handleInquiryCreateRequest (req, res, next) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    try {
      // Check if the email already exists in the waitlist
      const existingInquiry = await this.db('inquiries').where('email', email).first();
      if (existingInquiry) {
        return res.status(409).json({ message: "You're already on the waitlist!" });
      }

      //checks if there is an user with that email already
      const existingEmailUser = await this.db('users').where('email', email).first();
      if (existingEmailUser) {
        return res.status(409).json({ message: "This email is already registered for an User, please use another one." });
      }

      // Insert the new user into the database
      const newInquiry = await this.db('inquiries').insert({
        email: email
      });

      return res.json({ message: "You've been added to the waitlist!" });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error.  Try again later.' });
    }
  }

  async _handleRAGQuery (query) {
    console.debug('[SENSEMAKER:CORE]', '[RAG]', 'Query:', query);
    const result = await this.fabric.search({
      query: query,
      model: 'sensemaker-0.2.0-RC1'
    });

    return result;
  }

  async _handleConversationSearchRequest (req, res, next) {
    const request = req.body;
    console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Conversation search request:', request);

    this.searchConversations(request).then((results) => {
      console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Results:', results);

      res.setHeader('X-Fabric-Type', 'SearchResults');
      res.setHeader('X-Pagination', true);
      res.setHeader('X-Pagination-Current', `${results.pagination.from}-${results.pagination.to}`);
      res.setHeader('X-Pagination-Per', results.pagination.perPage);
      res.setHeader('X-Pagination-Total', results.pagination.total);

      res.json({
        status: 'success',
        message: 'Results retrieved successfully.',
        results: results
      });
    });
  }

  async _handleDiscordActivity (activity) {
    console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Discord activity:', activity);
    if (activity.actor == this.discord.id) return;

    // Handle DMs
    if (activity.target.type === 'dm') {
      let conversationID = null;
      let userID = null;
      let log = [];

      // Create (or Restore) Identities
      let id = null;
      const identity = await this.db('identities').where({ source: 'discord', content: activity.actor.ref }).first();
      if (!identity) {
        const actor = new Actor({ name: `discord/users/${activity.actor.ref}` });
        const ids = await this.db('identities').insert({
          fabric_id: actor.id,
          source: 'discord',
          content: activity.actor.ref
        });

        const duser = await this.db('identities').insert({
          fabric_id: actor.id,
          source: 'discord',
          content: activity.actor.username
        });

        id = ids[0];
      } else {
        id = identity.id;
      }

      const retrieved = await this.db('users').where({ discord_id: activity.actor.ref }).first();
      if (!retrieved) {
        const newUser = await this.db('users').insert({
          discord_id: activity.actor.ref,
          fabric_id: activity.actor.id,
          username: activity.actor.username
        });

        userID = newUser[0];
      } else {
        userID = retrieved.id;
      }

      // Create (or Restore) Conversation
      const resumed = await this.db('conversations').where({ fabric_id: activity.target.id }).first();
      if (!resumed) {
        const newConversation = await this.db('conversations').insert({
          creator_id: userID,
          discord_id: activity.actor.ref,
          fabric_id: activity.target.id,
          title: activity.target.username,
          log: JSON.stringify([])
        });

        conversationID = newConversation[0];
        log = [];
      } else {
        conversationID = resumed.id;
        log = resumed.log;
      }

      // TODO: add reactions
      const computingIcon = '⌛';
      const completedIcon = '✅';

      const inserted = await this.db('messages').insert({
        conversation_id: conversationID,
        content: activity.object.content,
        user_id: userID
      });

      log.push(inserted[0]);

      await this.db('conversations').where({ id: conversationID }).update({
        // updated_at: new Date().toISOString(),
        log: JSON.stringify(log),
        title: `Discord Chat with ${activity.actor.username}`
      });

      const request = this.handleTextRequest({
        conversation_id: conversationID,
        query: activity.object.content,
        platform: 'discord',
        username: activity.actor.username
      }).then((response) => {
        console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Response:', response);
        this.discord._sendToChannel(activity.target.ref, response.content);
      });

      console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Request:', request);
    }
  }

  async _handleDiscordAuthorizeRequest (req, res, next) {
    if (req.query.code) {
      let newFlow = false; // Flag for new user flow
      let id = null; // Identity

      const code = req.query.code;
      const token = await this.discord.exchangeCodeForToken(code);

      if (!token.access_token) {
        // TODO: show error message in client
        return res.redirect('/settings');
      }

      this.discord.getTokenUser(token.access_token).then(async (response) => {
        // Create Identity
        const identity = await this.db('identities').where({ source: 'discord', content: response.id }).first();
        if (!identity) {
          const actor = new Actor({ name: `discord/users/${response.id}` });
          const ids = await this.db('identities').insert({
            type: 'DiscordUserSnowflake',
            fabric_id: actor.id,
            user_id: req.user.id,
            source: 'discord',
            content: response.id
          });

          const duser = await this.db('identities').insert({
            type: 'DiscordUsername',
            fabric_id: actor.id,
            user_id: req.user.id,
            source: 'discord',
            content: response.username
          });

          id = ids[0];
        } else {
          id = identity.id;
        }

        const known = await this.db('users').where({ discord_id: response.id }).first();
        if (!known && req.user && req.user.id) {
          await this.db('users').where({ id: req.user.id }).update({
            discord_id: response.id
          });
        }

        if (!req.user.id) {
          newFlow = true;

          const existingUser = await this.db('users').where({ discord_id: response.id }).first();
          if (!existingUser) {
            // Create
            const uids = await this.db('users').insert({
              username: `${response.username} (Discord)`,
              discord_id: response.id,
            });

            req.user.id = uids[0];
          } else {
            req.user.id = existingUser.id;
          }

          const session = await fetch(`http://${this.settings.authority}/sessions`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token: token.access_token
            })
          });

          // Set session cookie
          const sessionResult = await session.json();
          res.cookie('token', sessionResult.token/* , { httpOnly: true } */);
        }

        const cids = await this.db('credentials').insert({
          content: token.access_token,
          type: token.type,
          expires_in: token.expires_in,
          scope: token.scope,
          refresh_token: token.refresh_token,
          user_id: req.user.id
        });

        // Redirect User
        if (newFlow) {
          await this.db('users').where({ id: req.user.id }).update({
            discord_id: response.id,
            discord_token_id: cids[0]
          });

          return res.redirect('/');
        } else {
          return res.redirect('/settings');
        }
      });
    } else {
      // Redirect User to Discord
      const link = this.discord.generateAuthorizeLink();
      return res.redirect(link);
    }
  }

  async _handleDiscordRevokeRequest (req, res, next) {
    // TODO: halt on !req.user.id
    // TODO: revoke token on Discord
    await this.db('users').where({ id: req.user.id }).update({
      discord_id: null,
      discord_token_id: null
    });

    // TODO: flash disconnected message
    return res.redirect('/settings');
  }

  async _handleDiscordError (error) {
    console.error('[SENSEMAKER:CORE]', '[DISCORD]', 'Error:', error);
  }

  async _handleDiscordMessage (message) {
    console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Message:', message);
  }

  async _handleDiscordLog (message) {
    console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Log Event:', message);
  }

  async _handleDiscordDebug (message) {
    console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Debug Event:', message);
  }

  async _handleDiscordReady (message) {
    console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Ready:', message);
  }

  async _handleHealthRequest (req, res, next) {
    try {
      const health = await this.checkHealth();
      console.debug('got health:', health);
      const response = {
        status: (health.results.filter((x) => x.status !== 'fulfilled').length) ? 'unhealthy' : 'healthy',
        services: health.results.map((x) => x.value),
        content: health
      };

      res.send(response);
    } catch (exception) {
      res.status(503);
      return res.send({
        status: 'unhealthy',
        content: exception
      });
    }
  }

  async _handlePeopleSearchRequest (req, res, next) {
    try {
      const request = req.body;
      const people = await this._searchPeople(request);
      const result = {
        people: people || []
      };

      return res.send({
        type: 'SearchCourtsResult',
        content: result,
        results: people
      });
    } catch (exception) {
      res.status(503);
      return res.send({
        type: 'SearchPeopleError',
        content: exception
      });
    }
  }

  async _handleMatrixActivity (activity) {
    console.debug('[SENSEMAKER:CORE]', '[MATRIX]', 'Matrix activity:', activity);
    if (activity.actor == this.matrix.id) return;
    if (!activity.target) {
      console.debug('[SENSEMAKER:CORE]', '[MATRIX]', 'No target, ignoring.');
      return;
    }

    const roomID = activity.target.split('/')[2];
    const computingIcon = '⌛';
    const completedIcon = '✅';

    let computingReaction = null;
    let completedReaction = null;

    const reactions = await this.matrix._getReactions(activity.object.id);
    if (!reactions.filter((x) => (x.key == computingIcon)).length) {
      try {
        computingReaction = await this.matrix._react(activity.object.id, computingIcon);
      } catch (exception) {

      }
    }

    const response = await this._handleRequest({
      actor: activity.actor,
      input: activity.object.content,
      room: roomID // TODO: replace with a generic property (not specific to Matrix)
      // target: activity.target // candidate 1
    });

    await this.matrix._send({
      object: response.object
    }, roomID);

    if (computingReaction) await this.matrix._redact(computingReaction.object.id);

    // Set reactions to reflect completed status
    const latestReactions = await this.matrix._getReactions(activity.object.id);

    if (!latestReactions.filter((x) => (x.key === completedIcon)).length) {
      try {
        completedReaction = await this.matrix._react(activity.object.id, completedIcon);
      } catch (exception) {

      }
    }

    return true;
  }

  async _handleFabricDebug (...props) {
    console.debug('[FABRIC]', '[DEBUG]', ...props);
  }

  async _handleFabricError (...props) {
    console.error('[FABRIC]', '[ERROR]', ...props);
  }

  async _handleFabricDocument (document) {
    console.error('[FABRIC]', '[DOCUMENT]', '[INSERT]', document);
    const inserted = await this.db('documents').insert({
      fabric_id: document.id,
      description: document.description,
      created_at: document.created_at
    });
    console.debug('[FABRIC]', '[DOCUMENT]', '[INSERT]', `${inserted.length} documents inserted:`, inserted);
  }

  async _handleFabricPerson (person) {
    console.debug('[FABRIC]', '[PERSON]', person);
    const target = await this.db('people').where({ fabric_id: person.id }).first();
    console.debug('[FABRIC]', '[PERSON]', '[TARGET]', target);
    if (!target) {
      const inserted = await this.db('people').insert({
        fabric_id: person.id,
        full_name: person.full_name,
        name_first: person.name_first,
        name_middle: person.name_middle,
        name_last: person.name_last,
        name_suffix: person.name_suffix,
        date_of_birth: person.date_of_birth,
        date_of_death: person.date_of_death,
        courtlistener_id: person.ids?.courtlistener
      });

      console.debug('[FABRIC]', '[PERSON]', '[INSERTED]', inserted);
    }
  }

  async _handleOpenAIError (error) {
    this.emit('error', `[SERVICES:OPENAI] ${error}`);
  }

  async _handleOpenAIMessageStart (start) {
    // TODO: fix @fabric/core/types/message to allow custom message types
    start.type = 'MessageStart';
    const message = Message.fromVector(['MessageStart', JSON.stringify(start)]);
    this.http.broadcast(message);
  }

  async _handleOpenAIMessageChunk (chunk) {
    // TODO: fix @fabric/core/types/message to allow custom message types
    chunk.type = 'MessageChunk';
    const broadcast = Message.fromVector(['MessageChunk', JSON.stringify(chunk)]);
    this.http.broadcast(broadcast);

    const message = Message.fromVector(['MessageChunk', JSON.stringify(chunk)]);
    // this.http.deliver('', message);
  }

  async _handleOpenAIMessageEnd (end) {
    if (!end || !end.id) return console.trace('[DEBUG]', 'No end message ID provided!  END:', end);
    const where = {};

    if (end.id.length >= 32) {
      where.fabric_id = end.id;
    } else {
      where.id = end.id;
    }

    await this.db('messages').where(where).update({
      content: end.content,
      status: 'ready'
    });
  }

  async _handleOpenAIMessageWarning (warning) {
    console.warn('OPENAI WARNING:', warning);
  }

  /**
   * Retrieve a conversation's messages.
   * @returns {Array} List of the conversation's messages.
   */
  async _getRoomMessages (channelID) {
    const messages = [];
    const room = this.matrix.client.getRoom(channelID);

    if (!room) return messages;

    for (let i = 0; i < room.timeline.length; i++) {
      const event = room.timeline[i];

      if (event.getType() === 'm.room.message') {
        messages.push({
          role: (event.event.sender === this.settings.matrix.handle) ? 'assistant' : 'user',
          content: event.event.content.body,
          // name: event.event.
        });
      }
    }

    return messages;
  }

  async _getConversationMessages (conversationID) {
    const messages = await this.db('messages').where({ conversation_id: conversationID, status: 'ready' }).innerJoin('users', 'messages.user_id', 'users.id').select('messages.*', 'users.username');
    return messages;
  }

  async _handleMatrixReady () {
    const name = `${this.settings.alias} (${this.settings.moniker} v${this.settings.version})`;
    if (this.matrix._getAgentDisplayName() !== name) await this.matrix._setAgentDisplayName(name);

    const roomResult = await this.matrix.client.getJoinedRooms();

    for (let i = 0; i < roomResult.joined_rooms.length; i++) {
      const room = roomResult.joined_rooms[i];
      const members = await this.matrix.client.getJoinedRoomMembers(room);
      console.log(`room ${room} has ${Object.keys(members.joined).length}`);
      if (!Object.keys(members.joined).includes('@eric:fabric.pub')) {
        try {
          await this.matrix.client.invite(room, '@eric:fabric.pub');
        } catch (exception) {
          console.warn('[SENSEMAKER:CORE]', '[MATRIX]', 'Failed to invite admin to room:', room);
        }
      }
    }

    this.emit('debug', '[SENSEMAKER:CORE] Matrix connected and ready!');
  }

  async _handleMatrixError (error) {
    console.error('[SENSEMAKER:CORE]', 'Matrix error:', error);
  }

  /**
   * Generate a response to a request.
   * @param {SensemakerRequest} request The request.
   * @param {String} [request.room] Matrix room to retrieve conversation history from.
   * @returns {SensemakerResponse}
   */
  async _handleRequest (request) {
    this.emit('debug', `[SENSEMAKER:CORE] Handling request: ${JSON.stringify(request)}`);

    let messages = [];

    if (request.room) {
      // Matrix request
      console.debug('request has room:', request.room);
      const matrixMessages = await this._getRoomMessages(request.room);
      messages = messages.concat(matrixMessages);
    } else if (request.conversation_id) {
      // Resume conversation
      const prev = await this._getConversationMessages(request.conversation_id);
      messages = prev.map((x) => {
        return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
      });
    } else {
      // New conversation
      messages = messages.concat([{ role: 'user', content: request.input }]);
    }

    if (request.subject) {
      // Subject material provided
      messages.unshift({ role: 'user', content: `Questions will be pertaining to ${request.subject}.` });
    }

    // Prompt
    messages.unshift({
      role: 'system',
      content: this.settings.prompt
    });

    // Moderator
    // Fact-checks and summarizes outputs into a single coherent result.
    const moderator = new Actor({ name: '@sensemaker/moderator' });
    const agents = {};
    // moderator.summarize();

    // Generate unique ID from state
    const actor = new Actor({
      name: this.settings.name,
      prompt: this.settings.prompt,
      seed: this.settings.seed,
      state: {
        created: (new Date()).toISOString(),
        query: request.input,
        status: 'COMPUTING'
      }
    });

    // Store in database
    const inserted = await this.db('messages').insert({
      fabric_id: actor.id,
      conversation_id: request.conversation_id,
      user_id: 1,
      status: 'computing',
      content: 'Sensemaker is researching your question...'
    });

    // Generate Response
    const response = await this.openai._streamConversationRequest({
      conversation_id: request.conversation_id,
      message_id: inserted[0],
      messages: messages
    });

    // Update database with completed response
    const content = response.content.trim();
    const updated = await this.db('messages').where({ id: inserted[0] }).update({
      status: 'ready',
      content: content,
      updated_at: this.db.fn.now()
    });

    // If we get a preferred response, use it.  Otherwise fall back to a generic response.
    /* const text = (typeof openai !== 'undefined' && openai)
      ? openai.completion?.choices[0].message.content.trim()
      : "I'm sorry, but something went wrong.  Try again later."
      ; */

    /* this.emit('response', {
      prompt: request.input,
      response: text
    }); */

    return {
      id: inserted[0],
      content: content
    };
  }

  async _startWorkers () {
    for (let i = 0; i < this.workers.length; i++) {
      await this.workers[i].start();
    }
  }

  async _summarizeMessages (messages, max = 512) {
    return new Promise((resolve, reject) => {
      const query = `Summarize our conversation into a ${max}-character maximum as a paragraph.  Do not consider the initial prompt, focus on the user's messages as opposed to machine responses.`;
      const request = { query: query, messages: messages };
      this.sensemaker.query(request).catch(reject).then(resolve);
    });
  }

  async _summarizeMessagesToTitle (messages, max = 100) {
    return new Promise((resolve, reject) => {
      const query = `Summarize our conversation into a ${max}-character maximum as a title.  Do not use quotation marks to surround the title, and be as specific as possible with regards to subject material so that the user can easily identify the title from a large list conversations.  Do not consider the initial prompt, focus on the user's messages as opposed to machine responses.`;
      const request = { query: query, messages: messages };
      this.sensemaker.query(request).catch(reject).then(resolve);
    });
  }

  async _generateEmbedding (text = '', model = 'text-embedding-ada-002') {
    const embeddings = await this.openai.generateEmbedding(text, model);
    if (embeddings.length !== 1) throw new Error('Embedding length mismatch!');

    const embedding = embeddings[0].embedding;
    const blob = JSON.stringify(embedding);
    const actor = new Actor({ content: blob });
    const inserted = await this.db('embeddings').insert({
      fabric_id: actor.id,
      text: text,
      model: embeddings[0].model,
      content: blob
    });

    return {
      id: inserted[0],
      model: model,
      content: embedding
    };
  }

  async _searchDocuments (request) {
    return new Promise((resolve, reject) => {
      console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Searching documents:', request);
      if (!request) throw new Error('No request provided.');
      if (!request.query) throw new Error('No query provided.');

      // Specify filter
      request.filter = { type: 'document' };

      // Use vector search
      this.trainer.search(request, 1).then(async (results) => {
        let response = [];
        console.debug('search results:', results.content);
        for (let i = 0; i < results.content.length; i++) {
          const result = results.content[i];
          switch (result.metadata.type) {
            case 'document':
              const document = await this.db('documents').where({ id: result.metadata.id }).first();
              response.push(document);
              break;
            case 'file':
              const file = await this.db('files').where({ id: result.metadata.id }).first();
              console.debug('[SEARCH]', '[DOCUMENTS]', 'File:', file);
              response.push(file);
              break;
            default:
              console.debug('[SEARCH]', '[DOCUMENTS]', 'Unknown result type:', result.metadata.type);
              break;
          }
        }

        resolve(response);
      });

      // Direct keyword search (expensive)
      /* try {
        // response = await this.db('documents ').select('*').where('content', 'like', `%${request.query}%`).orWhere('title', 'like', `%${request.query}%`).andWhere('deleted', '=', 0);;
      } catch (exception) {
        console.error('[SENSEMAKER:CORE]', '[SEARCH]', 'Failed to search documents :', exception);
      } */
    });
  }

  async _searchPeople (request) {
    console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Searching people:', request);
    if (!request) throw new Error('No request provided.');
    if (!request.query) throw new Error('No query provided.');

    const results = [];
    const tokens = this._tokenizeTerm(request.query);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const people = await this.db('people')
        .select('*')
        .where('full_name', 'like', `%${token}%`)
        .orWhere('name_first', 'like', `%${token}%`)
        .orWhere('name_last', 'like', `%${token}%`)
        .orWhere('name_middle', 'like', `%${token}%`)
        .orWhere('name_suffix', 'like', `%${token}%`);

      results = results.concat(people);
    }

    return results;
  }

  async _searchPeopleByTerm (term) {
    if (!term) throw new Error('No term provided.');
  }

  _tokenizeTerm (term) {
    return term.split(/\s/g);
  }

  async _produceAnswer (request) {
    const query = request.query;
    const tokens = this._tokenizeTerm(query);
    const embeddings = await Promise.all(tokens.map((token) => {
      return this._generateEmbedding(token);
    }));

    const result = await this.openai.generateAnswer(query, embeddings);
    console.debug('got answer:', result);

    return result;
  }

  async _requestWork (name, method) {
    this.queue._addJob({
      method: name,
      params: [JSON.stringify(method)]
    });
  }

  async _registerService (name, Service) {
    const self = this;
    const settings = merge({}, this.settings, this.settings[name]);
    const service = new Service(settings);

    if (this.services[name]) {
      return this.emit('warning', `Service already registered: ${name}`);
    }

    this.services[name] = service;
    this.services[name].on('error', function (msg) {
      self.emit('error', `Service "${name}" emitted error: ${JSON.stringify(msg, null, '  ')}`);
    });

    this.services[name].on('warning', function (msg) {
      self.emit('warning', `Service warning from ${name}: ${JSON.stringify(msg, null, '  ')}`);
    });

    this.services[name].on('message', function (msg) {
      self.emit('log', `Service message from ${name}: ${JSON.stringify(msg, null, '  ')}`);
      // self.node.relayFrom(self.node.id, Message.fromVector(['ChatMessage', JSON.stringify(msg)]));
    });

    this.on('identity', async function _registerActor (identity) {
      if (this.settings.services.includes(name)) {
        self.emit('log', `Registering actor on service "${name}": ${JSON.stringify(identity)}`);

        try {
          let registration = await this.services[name]._registerActor(identity);
          self.emit('log', `Registered Actor: ${JSON.stringify(registration, null, '  ')}`);
        } catch (exception) {
          self.emit('error', `Error from service "${name}" during _registerActor: ${exception}`);
        }
      }
    });

    if (service.routes && service.routes.length) {
      for (let i = 0; i < service.routes.length; i++) {
        const route = service.routes[i];
        this.http._addRoute(route.method, route.path, route.handler);
      }
    }

    await this.commit();

    return this;
  }

  async _runFixtures () {
    const FABRIC_FIXTURE = await this.fabric.search({
      query: 'North\nCarolina',
      model: 'sensemaker-0.2.0-RC1'
    });
    console.debug('FABRIC FIXTURE:', FABRIC_FIXTURE);

    // Simulate Network
    const summarizerQuery = 'List 3 interesting cases in North Carolina throughout history.';

    // Agents in the simulated network
    const agentMistral = new Mistral({ name: 'Mistral-V2', prompt: this.settings.prompt });
    const agentAlpha = new Agent({ name: 'ALPHA', prompt: 'You are ALPHA, the first node.', openai: this.settings.openai });
    // const agentBeta = new Agent({ name: 'BETA', prompt: 'You are BETA, the second node.', openai: this.settings.openai });
    // const agentGamma = new Agent({ name: 'GAMMA', prompt: 'You are GAMMA, the first production node.' });

    // TODO: Promise.allSettled([agentAlpha.start(), agentBeta.start(), agentGamma.start()]);
    const MISTRAL_FIXTURE = await agentMistral.query({ query: summarizerQuery });
    const ALPHA_FIXTURE = await agentAlpha.query({ query: summarizerQuery });
    // const BETA_FIXTURE = await agentBeta.query({ query: summarizerQuery });
    // const GAMMA_FIXTURE = await agentGamma.query({ query: summarizerQuery });
    console.debug('MISTRAL FIXTURE:', MISTRAL_FIXTURE);

    const SUMMARIZER_FIXTURE = await this.summarizer.query({
      query: 'Answer the user query using the various answers provided by the agent network.  Use deductive logic and reasoning to verify the information contained in each, and respond as if their answers were already incorporated in your core knowledge.  The existence of the agent network, or their names, should not be revealed to the user.  Write your response as if they were elements of your own memory.\n' +
        ':\n```\nagents:\n- [ALPHA]: '+`${ALPHA_FIXTURE.content}`+`\n- [BETA]: ${MISTRAL_FIXTURE.content}\n- [GAMMA]: undefined\n\`\`\``,
      messages: [
        {
          role: 'user',
          content: `[ALPHA] ${ALPHA_FIXTURE.content}`
        }
      ]
    });

    console.debug('SUMMARIZER FIXTURE:', SUMMARIZER_FIXTURE);

    // Test Extractor
    let randomCases = await this.openai._streamConversationRequest({
      messages: [
        {
          role: 'user',
          content: 'Provide a list of 10 random cases from North Carolina.'
        }
      ]
    });

    if (!randomCases) {
      const sourced = await this.db('cases').select('id', 'fabric_id', 'title').whereNotNull('harvard_case_law_id').orderByRaw('RAND()').first();
      randomCases = { content: `[${sourced.fabric_id}] [sensemaker/cases/${sourced.id}] ${sourced.title}` };
    }

    console.debug('GOT RANDOM CASES:', randomCases);

    const AUGMENTOR_FIXTURE = await this.augmentor.query({
      query: `Name an individual in an interesting case in North Carolina`
    });

    console.debug('AUGMENTOR FIXTURE:', AUGMENTOR_FIXTURE);

    // Test Extractor
    const EXTRACTOR_FIXTURE = await this.extractor.query({
      query: randomCases.content
    });

    // Test Validator
    const VALIDATOR_FIXTURE = await this.validator.query({
      query: EXTRACTOR_FIXTURE.response
    });

    // Test RAG Query
    const RAG_FIXTURE = await this.rag.query({
      query: `Find a case that is similar to ${randomCases.content.split(' ').slice(2).join(' ')}.`
    });

    console.debug('EXTRACTOR FIXTURE:', EXTRACTOR_FIXTURE);
    console.debug('VALIDATOR FIXTURE:', VALIDATOR_FIXTURE);
    console.debug('RAG FIXTURE:', RAG_FIXTURE);
  }

  async _syncEmbeddings (limit = 100) {
    console.debug('[SENSEMAKER:CORE]', '[VECTOR]', `Syncing ${limit} embeddings...`);
    return new Promise((resolve, reject) => {
      Promise.all([
        /* new Promise((resolve, reject) => {
          fs.readdir(this.settings.files.corpus, async (err, files) => {
            if (err) return reject(err);
            console.debug('[SENSEMAKER]', '[VECTOR]', 'Corpus files:', files);
            const reference = await this.trainer.ingestDirectory(this.settings.files.corpus);
            console.debug('[SENSEMAKER]', '[VECTOR]', '[CORPUS]', 'Ingested:', reference);
            resolve(files);
          });
        }), */
        this.db('documents').select(['id', 'description', 'content']).whereNotNull('content').orderByRaw('RAND()').limit(limit).then(async (documents) => {
          for (let i = 0; i < documents.length; i++) {
            const element = documents[i];
            const actor = { name: `sensemaker/documents/${element.id}` };
            // TODO: consider additional metadata fields
            const document = { name: `sensemaker/documents/${element.id}`, content: element };
            const embedding = await this.trainer.ingestDocument({ content: JSON.stringify(document), metadata: document }, 'document');
            if (this.settings.verbosity > 4) console.debug('[SENSEMAKER:CORE]', '[VECTOR]', '[DOCUMENTS]', 'Ingested:', embedding);
          }
        })
      ]).catch(reject).then(resolve);
    });
  }

  _handleServiceMessage (source, message) {
    // TODO: direct store to graph database
  }

  _handleTrustedLog (message) {
    this.emit('log', `[types/sensemaker] Trusted Source emitted log: ${message}`);
  }

  _handleTrustedMessage (message) {
    this.emit('message', message);
  }

  _handleTrustedWarning (message) {
    this.emit('warning', `[types/sensemaker] Trusted Source emitted warning: ${message}`);
  }

  _handleTrustedError (message) {
    this.emit('error', `[types/sensemaker] Trusted Source emitted error: ${message}`);
  }

  _handleTrustedReady (message) {
    this.emit('log', `[types/sensemaker] Trusted Source emitted ready: ${message}`);
  }

  _listServices () {
    return Object.keys(this.services);
  }

  _userMiddleware (req, res, next) {
    // Initialize user object (null id = anonymous)
    req.user = {
      id: null
    };

    // TODO: use response signing (`X-Fabric-HTTP-Signature`, etc.)
    // const ephemera = new Key();
    let token = null;

    // Does the request have a cookie?
    if (req.headers.cookie) {
      // has cookie, parse it
      req.cookies = req.headers.cookie
        .split(';')
        .map((x) => x.trim().split(/=(.+)/))
        .reduce((acc, curr) => {
          acc[curr[0]] = curr[1];
          return acc;
        }, {});

      token = req.cookies['token'];
    }

    // no cookie, has authorization header
    if (!token && req.headers.authorization) {
      console.debug('found authorization header:', req.headers.authorization);
      const header = req.headers.authorization.split(' ');
      if (header[0] == 'Bearer' && header[1]) {
        token = header[1];
      }
    }

    // read token
    if (token) {
      const parts = token.split('.');

      if (parts && parts.length == 3) {
        // Named parts
        const headers = parts[0]; // TODO: check headers
        const payload = parts[1];
        const signature = parts[2]; // TODO: check signature

        // Decode the payload
        const inner = Token.base64UrlDecode(payload);

        try {
          const obj = JSON.parse(inner);
          if (this.settings.audit) this.emit('debug', `[AUTH] Bearer Token: ${JSON.stringify(obj)}`);
          req.user.id = obj.sub;
          req.user.role = obj.role || 'asserted';
          req.user.state = obj.state || {};
        } catch (exception) {
          console.error('Invalid Bearer Token:', inner)
        }
      }
    }

    next();
  }

  //redis channel subscriber handlers
  async _handleFileIngested (file_id) {
    let updated;

    try {
      updated = await this.db('files').where({ id: file_id }).update({ status: 'ingested', updated_at: new Date() });
    } catch (exception) {
      console.error('Unable to update file:', exception);
    }

    return updated;
  }

  async _handleDocumentIngested (document_id) {
    let updated;

    try{
      updated = await this.db('documents').where({ id: document_id }).update({ ingestion_status: 'ingested', updated_at: new Date()});
    } catch (exception) {
      console.error('Unable to update document:', exception);
    }

    return updated;
  }
}

module.exports = Sensemaker;
