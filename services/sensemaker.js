/**
 * # Sensemaker Core
 * This file contains the main class definition for the Sensemaker service.
 * Methods prefixed by `_` are considered private and should not be called directly.
 * @extends {Hub} Instance of Fabric Hub (`@fabric/hub`), the reference implementation of a Fabric Edge server.
 */
'use strict';

// Prepare transpilation
require('@babel/register');

// const why = require('why-is-node-running');

// Package
const definition = require('../package');
const {
  BCRYPT_PASSWORD_ROUNDS,
  SNAPSHOT_INTERVAL,
  AGENT_MAX_TOKENS,
  MAX_RESPONSE_TIME_MS,
  PER_PAGE_LIMIT,
  PER_PAGE_DEFAULT,
  USER_QUERY_TIMEOUT_MS,
  PIPELINE_PARALLEL_MS,
  PIPELINE_FINAL_SUMMARY_MS,
  SYNC_EMBEDDINGS_COUNT,
  ENABLE_SOURCES
} = require('../constants');

// Fabric Constants
const {
  BITCOIN_GENESIS_HASH
} = require('@fabric/core/constants');

// Dependencies
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

// External Dependencies
const { createClient } = require('redis');
const fetch = require('cross-fetch');
const merge = require('lodash.merge');
// TODO: use levelgraph instead of level?
// const levelgraph = require('levelgraph');
const knex = require('knex');
const { attachPaginate } = require('knex-paginate');
const multer = require('multer');
// TODO: use bcryptjs instead of bcrypt?
const { hashSync, compareSync, genSaltSync } = require('bcrypt'); // user authentication

// Fabric
const Hub = require('@fabric/hub'); // messaging hub

// HTTP Bridge
const HTTPServer = require('@fabric/http/types/server'); // fabric edge server
const Sandbox = require('@fabric/http/types/sandbox'); // edge client sandbox (web browser)

// Fabric Types
// TODO: reduce to whole library import?
const Federation = require('@fabric/core/types/federation'); // fabric federation
const Key = require('@fabric/core/types/key'); // fabric keys
const Peer = require('@fabric/core/types/peer'); // fabric peers
const Token = require('@fabric/core/types/token'); // fabric tokens
const fabricAuth = require('@fabric/http/middlewares/auth');
const nodeSessionToken = require('./nodeSessionToken');
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
const Lightning = require('@fabric/core/services/lightning');
// const WebHooks = require('@fabric/webhooks');
const Discord = require('@fabric/discord');
// const GitHub = require('@fabric/github');
// const Twilio = require('@fabric/twilio');
// const Twitter = require('@fabric/twitter');
// const StarCitizen = require('@rsi/star-citizen');

// Services
const Fabric = require('./fabric');
const EmailService = require('./email');
const { buildPipelineFanOut } = require('./textRequestPipeline');
const chatStreamBridge = require('./chatStreamBridge');
// const Gemini = require('./gemini');
// const Mistral = require('./mistral');
// const OpenAI = require('./openai');
const Stripe = require('./stripe');

// Contracts
const Beacon = require('../contracts/beacon');

// Internal Types
const Agent = require('../types/agent');
const Graph = require('../types/graph');
// const Brain = require('../types/brain');
const Coordinator = require('../types/coordinator');
const Learner = require('../types/learner');
const Pool = require('../types/pool');
const Trainer = require('../types/trainer');
const Worker = require('../types/worker');
const Queue = require('../types/queue');
const ActiveWorkerQueue = require('./activeWorkerQueue');
const { getRegistry } = require('../types/ServiceUIRegistry');

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

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Received SIGINT, shutting down...');
      await this.stop();
    });

    // Handle SIGTERM
    process.on('SIGTERM', async () => {
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Received SIGTERM, shutting down...');
      await this.stop();
    });

    // Settings
    this.settings = merge({
      signingKey: settings.signingKey || null, // Server's signing key for verification
      crawl: false,
      debug: false,
      seed: null,
      port: 7777,
      precision: 8, // precision in bits for floating point compression
      persistent: true,
      path: './logs/sensemaker',
      passphrase: null,
      coordinator: '!TsLXBhlUcDLbRtOYIU:fabric.pub',
      frequency: 0.01, // Hz (once every ~100 seconds)
      temperature: 0,
      agents: null,
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
        listen: false, // Disable HTTP
        port: 4242
      },
      commitments: [],
      constraints: {
        tolerance: 100, // 100ms
        memory: {
          max: Math.pow(2, 26) // ~64MB RAM
        }
      },
      ollama: {
        enable: false // Disable Ollama
      },
      openai: {
        enable: false // Disable OpenAI
      },
      bitcoin: {
        enable: false // Disable Bitcoin
      },
      discord: {
        enable: false // Disable Discord
      },
      email: {
        enable: false // Disable Email
      },
      redis: null, // Disable Redis
      remotes: {},
      services: [], // Disable all services
      state: {
        status: 'INITIALIZED',
        agents: {},
        clock: 0,
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
            balance: 0,
            blocks: {},
            mempool: null,
            transactions: {}
          },
        }
      },
      crawlDelay: 2500,
      interval: 86400 * 1000,
      verbosity: 2,
      verify: true,
      workers: 1,
      name: 'Sensemaker',
      /** Absolute site origin for emailed links (e.g. http://127.0.0.1:3040). Falls back to `authority`. */
      baseUrl: null
    }, settings);

    // Vector Clock
    this.clock = 0;

    // Fabric Setup
    this._rootKey = new Key({
      mnemonic: this.settings.mnemonic,
      seed: this.settings.seed,
      xprv: this.settings.xprv,
      passphrase: this.settings.passphrase
    });

    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[KEY]', 'Root key initialized:', {
      seed: this._rootKey.seed,
      xprv: this._rootKey.xprv,
      xpub: this._rootKey.xpub,
      hasXprv: !!this._rootKey.xprv,
      hasXpub: !!this._rootKey.xpub
    });

    if (!this._rootKey || !this._rootKey.xprv) {
      throw new Error('Failed to initialize root key');
    }

    // Internals
    this.graph = new Graph({ ...this.settings, key: { xprv: this._rootKey.xprv } });
    // this.brain = new Brain(this.settings);
    this.chain = new Chain(this.settings);
    this.queue = new Queue({
      ...this.settings,
      verbosity: 0, // Suppress logs after startup
      debug: false // Disable debug logs
    });

    /** One serial NLP / conversation worker + FIFO queue (see {@link ActiveWorkerQueue}). */
    this.activeWorkerQueue = new ActiveWorkerQueue(this);

    /** Per-task cooldown so idle background work does not hammer the same row. */
    this._lastBackgroundTaskAtById = new Map();

    /** `'conversation' | 'background' | null` while the active worker runs a job. */
    this._workerJobKind = null;

    // Audits
    this.audits = new Logger(this.settings);
    // this.learner = new Learner(this.settings);
    this.trainer = new Trainer({ ...this.settings, key: { xprv: this._rootKey.xprv } });
    this.coordinator = new Coordinator({
      name: 'Sensemaker',
      goals: this.settings.goals,
      actions: ['idle', 'proceed'],
      agent: this.settings.ollama,
      key: { xprv: this._rootKey.xprv }
    });

    this.router = new Coordinator({
      name: 'Router',
      goals: this.settings.goals,
      actions: ['idle', 'proceed'],
      agent: this.settings.ollama,
      key: { xprv: this._rootKey.xprv }
    });

    this.sandbox = new Sandbox(this.settings.sandbox);
    this.worker = new Worker({ ...this.settings, key: { xprv: this._rootKey.xprv } });

    // Optional managed regtest (separate bitcoind). Off by default so Sensemaker can run
    // next to Hub or another local bitcoind without port conflicts. Enable with
    // settings.bitcoin.regtest === true or BITCOIN_REGTEST=1 / SENSEMAKER_REGTEST=1.
    if (this.settings.bitcoin && this.settings.bitcoin.regtest === true) {
      this.regtest = new Bitcoin({
        debug: this.settings.bitcoin.debug,
        key: { xprv: this._rootKey.xprv },
        mode: 'rpc',
        managed: true,
        network: 'regtest',
        host: '127.0.0.1',
        rpcport: 20444,
        username: 'ahp7iuGhae8mooBahFaYieyaixei6too',
        password: 'naiRe9wo5vieFayohje5aegheenoh4ee',
        zmq: {
          host: '127.0.0.1',
          port: 29500
        }
      });
    } else {
      this.regtest = null;
    }

    /**
     * Permanent playnet facet: a {@link Hub} wired to regtest RPC (defaults to 127.0.0.1:18443).
     * Used for playnet-only flows (e.g. host donations) independent of mainnet / `this.bitcoin.enable`.
     * Does not start Fabric P2P or HTTP; only its Bitcoin client is started in {@link Sensemaker#start}.
     */
    this._playnetDonationAddress = null;
    try {
      const playnetP2PPort = (Number(this.settings.port) || 7777) + 11111;
      this.playnet = new Hub({
        name: `${this.settings.name}:playnet`,
        key: {
          xprv: this._rootKey.xprv,
          xpub: this._rootKey.xpub,
          seed: this.settings.seed,
          mnemonic: this.settings.mnemonic,
          passphrase: this.settings.passphrase
        },
        port: playnetP2PPort,
        http: { listen: false, port: 0, hostname: '127.0.0.1' },
        peers: [],
        peersDb: path.join(process.cwd(), 'stores/sensemaker/playnet-hub-peers'),
        beacon: { enable: false },
        services: ['bitcoin'],
        verbosity: 0,
        debug: false,
        bitcoin: {
          enable: true,
          managed: false,
          network: 'regtest',
          host: process.env.SENSEMAKER_PLAYNET_RPC_HOST || process.env.FABRIC_BITCOIN_HOST || '127.0.0.1',
          rpcport: Number(process.env.SENSEMAKER_PLAYNET_RPC_PORT || 18443),
          username: process.env.SENSEMAKER_PLAYNET_RPC_USER || process.env.FABRIC_BITCOIN_USERNAME || process.env.BITCOIN_RPC_USER || '',
          password: process.env.SENSEMAKER_PLAYNET_RPC_PASSWORD || process.env.FABRIC_BITCOIN_PASSWORD || process.env.BITCOIN_RPC_PASS || '',
          startTimeoutMs: Number(process.env.SENSEMAKER_PLAYNET_START_TIMEOUT_MS || 12000)
        }
      });
    } catch (playnetErr) {
      console.warn('[SENSEMAKER:CORE]', '[PLAYNET]', 'Playnet Hub not created:', playnetErr.message || playnetErr);
      this.playnet = null;
    }

    // Services
    try {
      if (this.settings.bitcoin && this.settings.bitcoin.enable) {
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Initializing Bitcoin service...');
        this.bitcoin = new Bitcoin(this.settings.bitcoin);
      }
    } catch (error) {
      console.warn('[SENSEMAKER:CORE]', 'Could not initialize Bitcoin service:', error);
      this.bitcoin = null;
    }

    this.email = (this.settings.email && this.settings.email.enable) ? new EmailService(this.settings.email) : null;
    // this.github = (this.settings.github.enable) ? new GitHub(this.settings.github) : null;
    if (this.settings.discord && this.settings.discord.enable) this.discord =  new Discord(merge({}, this.settings.discord, { authority: this.settings.authority }));
    if (this.settings.stripe && this.settings.stripe.enable) this.stripe = new Stripe(this.settings.stripe);
    if (this.settings.rsi && this.settings.rsi.enable) this.rsi = new StarCitizen(this.settings.rsi);
    // this.twitter = (this.settings.twitter.enable) ? new GitHub(this.settings.twitter) : null;

    // Collections
    this.actors = new Collection({ name: 'Actors' });
    this.feeds = new Collection({ name: 'Feeds '});
    this.messages = new Collection({ name: 'Messages' });
    this.objects = new Collection({ name: 'Objects' });
    this.sources = new Collection({ name: 'Sources' });

    // TODO: use path
    // TODO: enable recursive Filesystem (directories)
    this.fs = new Filesystem({ path: './stores/sensemaker', key: { xprv: this._rootKey.xprv } });

    // Federation Setup
    this._federation = new Federation(this.settings.federation);
    this._federation._state.content = {
      ...this._federation.state,
      key: {
        xprv: this._rootKey.xprv,
        xpub: this._rootKey.xpub,
        path: "m/44'/0'/0'/0/0", // BIP44: purpose=44', coin=0' (BTC), account=0', change=0, index=0
        passphrase: this.settings.passphrase
      }
    };

    // Fabric
    this.fabric = new Fabric({
      ...this.settings.fabric,
      key: this._rootKey
    });

    // Embeddings, Search, and Clustering
    this.cluster = new Trainer(this.settings);
    this.pool = new Pool({
      debug: !!this.settings.debug,
      members: [
        this.settings.ollama,
        { ...this.settings.ollama, name: 'MARTINDALE', host: '192.168.50.5', model: 'llama3.2' },
        // { ...this.settings.ollama, name: 'GOLIATH:QWEN', host: '10.0.0.1', model: 'qwen3:0.6b' },
        // { ...this.settings.ollama, name: 'GOLIATH:BASE', host: '10.0.0.1', model: 'llama3.2' },
        // { ...this.settings.ollama, name: 'GOLIATH:DEEPSEEK:LATEST', host: '10.0.0.1', model: 'deepseek-r1:latest' },
        // { ...this.settings.ollama, name: 'GOLIATH:DEEPSEEK:32B', host: '10.0.0.1', model: 'deepseek-r1:32b' },
        // To enable concurrency, assign a name:
        // { ...this.settings.ollama, name: 'namedPool0' },
        // { ...this.settings.ollama, name: 'namedPool1' },
        // { ...this.settings.ollama, name: 'namedPool2' },
        // Example usage of OpenRouter
        /* {
          ...settings.ollama,
          model: 'deepseek/deepseek-r1-0528:free',
          host: 'openrouter.ai',
          port: 443,
          secure: true,
          path: '/api/v1',
          headers: {
            'Authorization': `Bearer ${this.settings.openrouter.token}`,
            'Content-Type': 'application/json'
          }
        } */
      ]
    });

    // Beacon
    this.beacon = new Beacon({
      name: 'SENSEMAKER:BEACON',
      debug: false,
      interval: this.settings.interval,
      key: {
        xprv: this._rootKey.xprv,
        xpub: this._rootKey.xpub
      },
      path: "m/44'/0'/0'/0/0", // BIP44 standard Bitcoin derivation path
      passphrase: this.settings.passphrase,
      state: {
        bitcoin: {
          tip: {
            height: 0,
            hash: BITCOIN_GENESIS_HASH
          }
        }
      }
    });

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
      // TODO: replace with Resource definitions
      routes: [
        // { method: 'GET', route: '/tasks', handler: ROUTES.tasks.list },
        // { method: 'POST', route: '/tasks', handler: ROUTES.tasks.create }
      ],
      sessions: false
    });

    // File Uploads
    // TODO: check for vulnerabilities, easy setup
    this.uploader = new multer({ dest: this.settings.files.path });

    // TODO: evaluate use of temperature
    // this.openai.settings.temperature = this.settings.temperature;

    // Internals
    this.agents = {};
    this.healths = {};
    this.services = {};
    this.sources = {};
    this.tools = {};

    // Service UI Registry
    this.uiRegistry = getRegistry();
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
      key: this.settings.key,
      prompt: this.settings.prompt,
      constraints: this.settings.constraints,
      tools: true
    });

    // Custom Models
    // NOTE: these are tested with `llama3` but not other models
    this.searcher = new Agent({
      name: 'SEARCHER',
      rules: this.settings.rules,
      model: 'qwen3:0.6b',
      host: this.settings.ollama.host,
      port: this.settings.ollama.port,
      secure: this.settings.ollama.secure,
      key: this.settings.key,
      prompt: 'You are SearcherAI, designed to return only a search term most likely to return the most relevant results to the user\'s query, assuming your response is used elsewhere in collecting information from the Sensemaker database.  Only ever return the search query as your response.  Refrain from using generic terms such as "the", "a", etc., and simplify the search wherever possible to focus on the primary topic.  For example, when the inquiry is: "Where should I visit for vacation?" you should respond with "locations vacation" (excluding the quote marks).  Your responses will be sent directly to the network, so make sure to only ever respond with the best candidate for a search term for finding documents most relevant to the user question.  Leverage abstractions to extract the essence of the user request, using step-by-step reasoning to predict the most relevant search term.  If you are unsure, respond with "HALT" (excluding the quote marks).'
    });

    // TODO: use qwen3:0.6b
    this.summarizer = new Agent({
      name: this.settings.name,
      listen: false,
      model: this.settings.ollama.model,
      host: this.settings.ollama.host,
      secure: this.settings.ollama.secure,
      port: this.settings.ollama.port,
      key: this.settings.key,
      prompt: this.prompt
    });

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
      triggers: {},
      content: this.settings.state
    };

    this.redis = null;

    // TODO: See if we can put this in its own file.
    // knex.QueryBuilder.extend('paginate', KnexPaginator);
    // attachPaginate();

    // Extend QueryBuilder with cache and Redis support
    // knex.QueryBuilder.extend('cache', KnexCacher);
    /* knex.QueryBuilder.extend('redis', function () {
      // Store redis client reference
      this.redisClient = this.redis;

      // Wrap paginate to include redis and cache
      const originalPaginate = this.paginate;
      this.paginate = async function(...args) {
        const result = await originalPaginate.apply(this, args);
        result.redis = this.redisClient;
        result.cache = this.cache;
        return result;
      };

      return this;
    }.bind({ redis: this.redis })); */

    // Database connections
    this.db = knex({
      client: 'mysql2',
      connection: {
        host: this.settings.db.host,
        port: this.settings.db.port,
        user: this.settings.db.user,
        password: this.settings.db.password,
        database: this.settings.db.database,
        connectTimeout: 20000
      },
      pool: {
        min: parseInt(process.env.DB_POOL_MIN) || 1,
        max: parseInt(process.env.DB_POOL_MAX) || 5,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 60000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 60000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        propagateCreateError: false,
        afterCreate: (conn, done) => {
          // console.debug('[SENSEMAKER:CORE]', '[DB]', 'Connection created.');
          done(null, conn);
        }
      },
      acquireConnectionTimeout: 60000
    });

    // Attach pagination plugin (extends Knex QueryBuilder prototype; only once per process).
    // knex.QueryBuilder is the { extend } API, not the builder class — do not use .prototype there.
    const KnexQueryBuilder = require('knex/lib/query/querybuilder');
    if (typeof KnexQueryBuilder.prototype.paginate !== 'function') {
      attachPaginate();
    }

    // Test database connection
    this.db.raw('SELECT 1').then(() => {
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DB]', 'Database connection established successfully');
    }).catch((error) => {
      console.error('[SENSEMAKER:CORE]', '[DB]', 'Failed to connect to database:', error);
      console.error('[SENSEMAKER:CORE]', '[DB]', 'Please check your database configuration');
      // Don't exit, let the app continue and handle errors gracefully
    });

    // Add database error handler
    this.db.on('error', (error) => {
      console.error('[SENSEMAKER:CORE]', '[DB]', 'Database error:', error);
      if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('[SENSEMAKER:CORE]', '[DB]', 'Database connection was closed.');
      }

      if (error.code === 'ER_CON_COUNT_ERROR') {
        console.error('[SENSEMAKER:CORE]', '[DB]', 'Database has too many connections.');
      }

      if (error.code === 'ECONNREFUSED') {
        console.error('[SENSEMAKER:CORE]', '[DB]', 'Database connection was refused.');
      }
    });

    this.cache = {
      _data: new Map(),
      _ttl: new Map(),
      get: async (key) => {
        const now = Date.now();
        const ttl = this.cache._ttl.get(key);
        if (ttl && ttl < now) {
          this.cache._data.delete(key);
          this.cache._ttl.delete(key);
          return null;
        }
        return this.cache._data.get(key);
      },
      set: async (key, value, ttl = 60000) => {
        this.cache._data.set(key, value);
        this.cache._ttl.set(key, Date.now() + ttl);
      }
    };

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

    this.fs._state.content = merge({}, this.fs.state, this.state);
    this.fs.commit();

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

    // Add message event handlers
    agent.on('message', (message) => {
      try {
        const data = JSON.parse(message.data);
        switch (data.type) {
          case 'MessageStart':
            this.emit('message', message);
            break;
          case 'MessageChunk':
            this.emit('message', message);
            break;
          case 'MessageEnd':
            this.emit('message', message);
            break;
        }
      } catch (e) {
        console.error('[SENSEMAKER:CORE]', 'Error handling agent message:', e);
      }
    });

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
        if (this.settings.debug) console.debug('Alert email sent successfully!');
      } catch (error) {
        console.error('Error sending alert email:', error);
      }
    }

    return true;
  }

  async syncTriggers () {
    if (this.settings.debug) console.debug('syncing triggers...');
    const triggers = await this.db('triggers').select('*', this.db.raw('fabric_id as id')).where({ status: 'active', type: 'keyword' });
    for (const trigger of triggers) {
      this._state.triggers[trigger.id] = trigger;
    }
  }

  async generateBlock () {
    return new Promise(async (resolve, reject) => {
      if (this.settings.debug) console.trace('generating block:', this.clock);
      // Sync Health First
      const health = await this.checkHealth();
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Health:', health);

      // Jobs
      // TODO: move to a different method... generateBlock should only snapshot existing state
      // Scan Remotes
      this.worker.addJob({ type: 'ScanRemotes', params: [] });

      // TODO: use a proper job for this
      await this.syncTriggers();

      if (this.settings.embeddings.enable) {
        /* this._syncEmbeddings(SYNC_EMBEDDINGS_COUNT).then((output) => {
          if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Embedding sync complete:', output);
        }); */
      }

      const commit = this.commit();
      const object = {
        commit: commit
      };

      const block = new Actor(object);
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Block:', block);

      resolve(block);
    });
  }

  async tick () {
    const now = (new Date()).toISOString();
    this._lastTick = JSON.parse(JSON.stringify(this.clock || 0));
    ++this.clock;

    this._state.clock = this.clock;
    const epoch = await this.beacon.createEpoch();
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[TICK]', 'Epoch:', epoch);

    this._state.content = merge({}, this._state.content, { clock: this.clock });
    this._state.content = merge({}, this._state.content, { beacon: this.beacon.state });

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
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[BEAT]', 'Start:', start);

    // Generate a new block in regtest mode
    if (this.bitcoin && this.bitcoin.network === 'regtest') {
      try {
        // Always generate a new address for each block
        const newAddress = await this.bitcoin._makeRPCRequest('getnewaddress', []);

        // Generate a new block to the new address
        await this.bitcoin._makeRPCRequest('generatetoaddress', [1, newAddress]);
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[BEAT]', 'Generated new block to address:', newAddress);
      } catch (err) {
        console.error('[SENSEMAKER:CORE]', '[BEAT]', 'Failed to generate block:', err);
      }
    }

    // TODO: remove async, use local state instead
    // i.e., queue worker job
    const balance = await this.services.bitcoin._syncBalanceFromOracle();
    const commit = new Actor({
      type: 'Commit',
      content: { ...this.state }
    });

    const beat = Message.fromVector(['COMMIT', {
      clock: this.clock,
      balance: balance.data.content,
      created: now,
      content: commit
    }]);

    if (this.key && this.key.private) beat.signWithKey(this.key);

    await this.tick();

    this.worker.addJob({
      type: 'ScanCourtListener',
      params: [
        { query: 'Documents not yet synchronized with Sensemaker.' }
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

  async bootstrap () {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[BOOTSTRAP]', 'Bootstrapping Sensemaker...');
    return new Promise((resolve, reject) => {
      // Check for Models
      this.sensemaker.listModels().then((models) => {
        if (models.length === 0) {
          console.warn('[SENSEMAKER:CORE]', '[BOOTSTRAP]', 'No models found, creating default Sensemaker model...');
          // TODO: fetch model file
          resolve();
        } else {
          if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[BOOTSTRAP]', 'Models found:', models);
          resolve(models);
        }
      }).catch((error) => {
        console.error('[SENSEMAKER:CORE]', '[BOOTSTRAP]', 'Error listing models:', error);
        reject(error);
      });
    });
  }

  /**
   * After a conversation reply is stored via handleTextRequest, refresh title/summary and broadcast.
   * @param {object} opts
   * @param {number} opts.localConversationID
   * @param {string} opts.fabricConversationID
   * @param {boolean} opts.isNew
   */
  async _finalizeConversationAfterReply ({ localConversationID, fabricConversationID, isNew }) {
    const history = await this._getConversationMessages(localConversationID);
    const messages = history.map((x) => {
      return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content };
    });

    if (isNew) {
      this._summarizeMessagesToTitle(messages).catch((error) => {
        console.error('[SENSEMAKER]', '[WORKER]', 'Error summarizing title:', error);
      }).then(async (output) => {
        let title = output?.content || 'broken content title';
        if (title && title.length > 100) title = title.split(/\s+/)[0].slice(0, 100).trim();
        if (title) await this.db('conversations').update({ title }).where({ id: localConversationID });
        const msg = { id: fabricConversationID, messages: messages, title: title };
        const message = Message.fromVector(['Conversation', JSON.stringify(msg)]);
        if (this.key && this.key.private) message.signWithKey(this.key);
        this.http.broadcast(message);
      });
    }

    this._summarizeMessages(messages).catch((error) => {
      console.error('[SENSEMAKER]', '[WORKER]', 'Error summarizing conversation:', error);
    }).then(async (output) => {
      if (this.settings.debug) console.debug('[SENSEMAKER]', '[WORKER]', 'Summarized conversation:', output);
      let summary = output?.content || 'broken content summary';
      if (summary && summary.length > 512) summary = summary.split(/\s+/)[0].slice(0, 512).trim();
      if (summary) await this.db('conversations').update({ summary }).where({ id: localConversationID });
      const msg = { id: fabricConversationID, messages: messages, summary: summary };
      const message = Message.fromVector(['Conversation', JSON.stringify(msg)]);
      if (this.key && this.key.private) message.signWithKey(this.key);
      this.http.broadcast(message);
    });
  }

  /**
   * Start only the playnet {@link Hub} Bitcoin RPC client (no Fabric P2P, beacon, or HTTP listener).
   */
  async _startPlaynetBitcoinIfPresent () {
    if (!this.playnet || !this.playnet.bitcoin) return;
    try {
      await this.playnet.bitcoin.start();
      if (typeof this.playnet._collectBitcoinStatus === 'function') {
        await this.playnet._collectBitcoinStatus({ force: true }).catch(() => {});
      }
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PLAYNET]', 'Playnet Bitcoin RPC ready.');
    } catch (e) {
      console.warn('[SENSEMAKER:CORE]', '[PLAYNET]', 'Playnet Bitcoin not available:', e.message || e);
    }
  }

  /**
   * Cached playnet receive address for donations to this host (regtest).
   * @returns {Promise<string|null>}
   */
  async _ensurePlaynetDonationAddress () {
    if (this._playnetDonationAddress) return this._playnetDonationAddress;
    const btc = this.playnet && this.playnet.bitcoin;
    if (!btc) return null;
    try {
      this._playnetDonationAddress = await btc.getUnusedAddress();
      return this._playnetDonationAddress;
    } catch (e) {
      console.warn('[SENSEMAKER:CORE]', '[PLAYNET]', 'Could not allocate donation address:', e.message || e);
      return null;
    }
  }

  /**
   * Oldest incomplete task that is not in a recent background cooldown window.
   * @returns {Promise<object|undefined>}
   */
  async _pickOldestBackgroundTask () {
    const cooldownMs = 15 * 60 * 1000;
    const now = Date.now();
    const rows = await this.db('tasks').whereNull('completed_at').orderBy('created_at', 'asc').limit(40);
    for (const row of rows) {
      const last = this._lastBackgroundTaskAtById.get(row.id);
      if (last && now - last < cooldownMs) continue;
      return row;
    }
    return null;
  }

  /**
   * Refresh `tasks.recommendation` when the node is otherwise idle.
   * @param {object} taskRow
   */
  async _processBackgroundTaskJob (taskRow) {
    this._workerJobKind = 'background';
    try {
      const prompt = this.settings.prompt;
      const query = `Given this task, write a short actionable recommendation (2–5 sentences). Be concrete.\n\nTitle: ${taskRow.title}\nDescription: ${taskRow.description || '(none)'}`;
      const summary = await this.sensemaker.query({
        prompt,
        messages: [{ role: 'user', content: query }],
        query,
        tools: false,
        stream: false
      });
      if (summary && typeof summary.content === 'string') {
        await this.db('tasks').where({ id: taskRow.id }).update({
          recommendation: summary.content,
          updated_at: this.db.fn.now()
        });
      }
      this._lastBackgroundTaskAtById.set(taskRow.id, Date.now());
    } finally {
      this._workerJobKind = null;
    }
  }

  /**
   * Run one queued chat turn: single-flight worker entry point.
   * @param {object} job
   */
  async _processConversationTurnJob (job) {
    this._workerJobKind = 'conversation';
    try {
      const conversation = await this.db('conversations').where({ id: job.local_conversation_id }).first();
      if (!conversation) throw new Error('Conversation not found');

      await this.db('messages').where({ id: job.response_message_id }).update({
        status: 'processing',
        content: 'Sensemaker is working on your reply...',
        updated_at: this.db.fn.now()
      });

      await this.handleTextRequest({
        conversation_id: job.conversation_fabric_id,
        context: job.context,
        agent: job.agent,
        query: job.query,
        user_id: job.user_id,
        existing_response_message_id: job.response_message_id
      });

      await this._finalizeConversationAfterReply({
        localConversationID: job.local_conversation_id,
        fabricConversationID: job.conversation_fabric_id,
        isNew: !!job.is_new
      });
    } finally {
      this._workerJobKind = null;
    }
  }

  async checkHealth () {
    const CHAT_QUERY = 'Health check!  Tell me some status values.';
    const poolHealth = this.pool.getPoolHealth();
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[HEALTH]', 'Pool health:', poolHealth);

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

      const poolSummary = {
        status: poolHealth.isHealthy ? 'fulfilled' : 'rejected',
        value: { kind: 'pool', ...poolHealth }
      };

      resolve({
        created: now.toISOString(),
        duration: (new Date()) - now,
        results: results.concat([poolSummary]).concat(summaries)
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
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial messages:', request.messages);
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial timeout:', request.timeout);

      // Prepare Metadata
      let conversation = null;
      let requestor = null;
      let messages = [];
      let priorConversations = null;
      let prompt = null;

      // Conversation Resume
      if (request.conversation_id) {
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Resuming conversation:', request.conversation_id);
        conversation = await this.db('conversations').select('id', 'agent_id', 'title', 'summary', 'created_at').where({ fabric_id: request.conversation_id }).first();
        if (!conversation) return reject(new Error('Conversation not found.'));
        const prev = await this._getConversationMessages(conversation.id);
        messages = prev.map((x) => {
          return { role: (x.user_id == 1) ? 'assistant' : 'user', name: (x.user_id == 1) ? '': undefined, content: x.content }
        });
      }

      let responseID;
      /** @type {{ id: string }} */
      let responseObject;

      if (request.existing_response_message_id) {
        const existing = await this.db('messages').where({ id: request.existing_response_message_id }).first();
        if (!existing) return reject(new Error('Response message not found.'));
        responseID = existing.id;
        let fabricId = existing.fabric_id;
        const createdForActor = existing.created_at ? new Date(existing.created_at) : now;
        if (!fabricId) {
          const a = new Actor({ type: 'LocalMessage', name: `sensemaker/messages/${responseID}`, created: createdForActor });
          fabricId = a.id;
          await this.db('messages').where({ id: responseID }).update({ fabric_id: fabricId });
        }
        responseObject = { id: fabricId };

        await this.db('messages').where({ id: responseID }).update({
          status: 'computing',
          content: `${this.settings.name} is researching your question...`,
          updated_at: this.db.fn.now()
        });
      } else {
        const localMessageIDs = await this.db('messages').insert({ conversation_id: conversation?.id, user_id: 1, status: 'computing', content: `${this.settings.name} is researching your question...` });
        responseID = localMessageIDs[0];
        const responseName = `sensemaker/messages/${responseID}`;
        responseObject = new Actor({ name: responseName });
      }

      if (request.user_id) {
        requestor = await this.db('users').select('username', 'created_at').where({ id: request.user_id }).first();
        request.username = requestor.username;
        request.user = { username: requestor.username, id: request.user_id };
        const conversationStats = await this.db('conversations').count('id as total').groupBy('creator_id').where({ creator_id: request.user_id });
        const recentConversations = await this.db('conversations').select('fabric_id as id', 'title', 'summary', 'created_at').where({ creator_id: request.user_id }).orderBy('created_at', 'desc').limit(20);
        priorConversations = recentConversations;
        if (conversationStats.total > 20) {
          priorConversations.push(`<...${conversationStats.total - 20} more conversations>`);
        }
      }

      let contextString = '';

      if (request.context) {
        const localContext = { ...request.context, created: created, owner: this.id };
        contextString = JSON.stringify(localContext);
        const contextBlob = JSON.stringify(localContext, '  ', null);
        // const contextCall = new Actor(localContext);
        /* messages.unshift({
          role: 'user',
          content: 'The context for our conversation is contained in the following object:\n\n' +
            '```js\n' +
            contextBlob + '\n' +
            '```'
        }); */

        /* messages.unshift({
          role: 'tool',
          tool_call_id: contextCall.id,
          name: 'get_provided_context',
          content: `${JSON.stringify(localContext, null, '  ')}`
        })

        messages.unshift({
          role: 'assistant',
          tool_calls: [{
            id: contextCall.id,
            type: 'function',
            function: {
              name: 'get_provided_context',
              arguments: JSON.stringify({})
            }
          }]
        }); */

        // Raw Context
        /* messages.unshift({
          role: 'tool',
          content: `${JSON.stringify(request.context, null, '  ')}\n`
        }); */
      }

      if (request.agent) {
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Agent:', request.agent);
        const agent = await this.db('agents').select('id', 'latest_prompt_blob_id').where({ id: request.agent }).first();
        if (!agent) {
          prompt = this.settings.prompt;
        } else {
          const blob = await this.db('blobs').select('content').where({ id: agent.latest_prompt_blob_id }).first();
          if (!prompt) prompt = this.settings.prompt;
          prompt = blob.content;
        }
      } else {
        prompt = this.settings.prompt;
      }

      if (request.user && !request.context) {
        const recentConversations = await this.db('conversations').select('id', 'title', 'summary', 'created_at')
          .where({ creator_id: request.user.id })
          .orderBy('created_at', 'desc')
          .limit(5);

        if (recentConversations.length > 0) {
          messages.unshift({
            role: 'user',
            content: `My recent conversations:\n\n` + recentConversations.map((conv) => {
              return `- [ ] ${conv.title} (${conv.created_at})`;
            }).join('\n')
          });
        }

        const oldestTasks = await this.db('tasks').select('id', 'title', 'created_at', 'due_date')
          .where({ creator: request.user.id })
          .whereNull('completed_at')
          .orderBy('created_at', 'asc')
          .limit(5);

        if (oldestTasks.length > 0) {
          messages.unshift({
            role: 'user',
            content: `My oldest outstanding tasks:\n\n` + oldestTasks.map((task) => {
              return `- [ ] ${task.title} (created: ${task.created_at})`;
            }).join('\n')
          });
        }

        const urgentTasks = await this.db('tasks').select('id', 'title', 'created_at', 'due_date')
          .where({ creator: request.user.id })
          .whereNull('completed_at')
          .whereNotNull('due_date')
          .orderBy('due_date', 'asc')
          .limit(5);

        if (urgentTasks.length > 0) {
          messages.unshift({
            role: 'user',
            content: `My urgent tasks:\n\n` + urgentTasks.map((task) => {
              return `- [ ] ${task.title} (due: ${task.due_date})`;
            }).join('\n')
          });
        }

        const announcements = await this.db('announcements')
          .select('id', 'title', 'body', 'created_at')
          .where(() => {
            this.db.where('expiration_date', '>', this.db.fn.now())
          })
          .orderBy('created_at', 'desc')
          .limit(5);

        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Recent announcements:', announcements);
        if (announcements.length > 0) {
          messages.unshift({
            role: 'user',
            content: `Recent announcements:\n\n` + announcements.map((ann) => {
              return `- ${ann.title} (${ann.created_at}): ${ann.body}`;
            }).join('\n\n')
          });
        }

        const currentTime = (new Date()).toISOString();
        messages.unshift({
          role: 'user',
          content: `The current time is: ${currentTime}`
        });
      }

      // Step A — optional document context (Searcher + vector search). Skipped when pipeline.skipDocumentRetrieval.
      const skipDocs = !!(this.settings.pipeline && this.settings.pipeline.skipDocumentRetrieval);
      if (!skipDocs) {
        const docRetrievalMs = Math.min(30000, Number(request.timeout) > 0 ? Number(request.timeout) : PIPELINE_PARALLEL_MS);
        try {
          await Promise.race([
            (async () => {
              if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DOCUMENT-RETRIEVAL]', 'Formulating search query...');
              const searchQueryResponse = await this.searcher.query({
                prompt: this.searcher.settings.prompt,
                query: request.query,
                messages: messages,
                tools: false
              });

              const searchQuery = searchQueryResponse.content.trim();
              if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DOCUMENT-RETRIEVAL]', 'Generated search query:', searchQuery);

              const documentSearchResults = await this._searchDocuments({
                query: searchQuery,
                user: request.user,
                limit: 5
              });

              if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DOCUMENT-RETRIEVAL]', 'Found documents:', documentSearchResults.length);
              if (this.settings.debug && documentSearchResults.length > 0) console.debug('[SENSEMAKER:CORE]', '[DOCUMENT-RETRIEVAL]', 'Sample document:', {
                id: documentSearchResults[0].id,
                title: documentSearchResults[0].title,
                fabric_type: documentSearchResults[0].fabric_type,
                filename: documentSearchResults[0].filename,
                name: documentSearchResults[0].name
              });

              if (documentSearchResults && documentSearchResults.length > 0) {
                const documentSummaries = documentSearchResults.slice(0, 5).map((doc, index) => {
                  const title = doc.title || doc.filename || doc.name || 'Untitled Document';
                  const docType = doc.fabric_type || 'Document';
                  const summary = doc.summary ? ': ' + doc.summary : '';
                  return `${index + 1}. "${title}" (${docType})${summary}`;
                }).join('\n');

                const documentMessage = {
                  role: 'user',
                  content: `Relevant documents found for this query:\n\n${documentSummaries}\n\nPlease consider these documents when formulating your response.`
                };

                messages.push(documentMessage);

                if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DOCUMENT-RETRIEVAL]', 'Added document context to conversation');
              } else {
                if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DOCUMENT-RETRIEVAL]', 'No relevant documents found');
              }
            })(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('DOC_RETRIEVAL_TIMEOUT')), docRetrievalMs))
          ]);
        } catch (error) {
          if (error.message === 'DOC_RETRIEVAL_TIMEOUT') {
            console.warn('[SENSEMAKER:CORE]', '[DOCUMENT-RETRIEVAL]', `Skipped after ${docRetrievalMs}ms (timeout).`);
          } else {
            console.error('[SENSEMAKER:CORE]', '[DOCUMENT-RETRIEVAL]', 'Error in document retrieval:', error);
          }
        }
      }

      // Prompt
      messages.unshift({
        role: 'system',
        content: prompt
      });

      const template = {
        context: request.context,
        prompt: prompt,
        query: request.query,
        messages: messages,
        tools: request.tools,
        user: request.user
      };

      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial template:', template);
      if (request.agent) {
        const sse = request._openAiStream;
        const streamAgent = !request.tools && !!sse;
        const openAiMetaAgent = sse ? {
          id: sse.completionId,
          model: sse.model || this.settings.ollama?.model || 'sensemaker',
          created: sse.created || Math.floor(Date.now() / 1000)
        } : null;

        if (streamAgent) {
          chatStreamBridge.fabricStreamStart(this, { id: responseObject.id, conversation_id: request.conversation_id });
          chatStreamBridge.writeSseEvent(sse.res, chatStreamBridge.openAiChatCompletionChunk({
            id: openAiMetaAgent.id,
            model: openAiMetaAgent.model,
            created: openAiMetaAgent.created,
            delta: { role: 'assistant' }
          }));
        }

        return this.sensemaker.query({
          ...template,
          stream: streamAgent,
          onStreamChunk: streamAgent ? (delta) => {
            chatStreamBridge.fabricStreamChunk(this, {
              id: responseObject.id,
              conversation_id: request.conversation_id,
              content: delta
            });
            chatStreamBridge.writeSseEvent(sse.res, chatStreamBridge.openAiChatCompletionChunk({
              id: openAiMetaAgent.id,
              model: openAiMetaAgent.model,
              created: openAiMetaAgent.created,
              delta: { content: delta }
            }));
          } : undefined
        }).then(async (summary) => {
          await this.db('messages').where({ id: responseID }).update({
            status: 'ready',
            content: summary.content,
            updated_at: this.db.fn.now()
          }).catch((error) => {
            console.error('could not update message:', error);
            reject(error);
          });
          if (streamAgent && openAiMetaAgent && !sse.res.writableEnded) {
            chatStreamBridge.writeSseEvent(sse.res, chatStreamBridge.openAiChatCompletionChunk({
              id: openAiMetaAgent.id,
              model: openAiMetaAgent.model,
              created: openAiMetaAgent.created,
              delta: {},
              finishReason: 'stop'
            }));
            chatStreamBridge.writeSseDone(sse.res);
            sse.res.end();
          }
          resolve(merge({}, summary, {
            actor: { name: this.name },
            object: { id: responseObject.id },
            target: { id: `${this.authority}/messages/${responseID}` },
            message_id: responseID
          }));
        }).catch((err) => {
          if (streamAgent && sse && !sse.res.writableEnded) {
            try {
              chatStreamBridge.writeSseEvent(sse.res, { error: { message: err.message || String(err), type: 'api_error' } });
            } catch (e) { /* ignore */ }
            chatStreamBridge.writeSseDone(sse.res);
            sse.res.end();
          }
          reject(err);
        });
      }

      // Normal Request
      /* console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Sensemaker request:', template);
      return this.sensemaker.query(template).then(async (response) => {
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Sensemaker response:', response);
        // Update database with completed response
        this.db('messages').where({ id: responseID }).update({
          status: 'ready',
          content: response.content,
          updated_at: this.db.fn.now()
        }).catch((error) => {
          console.error('could not update message:', error);
          reject(error);
        }).then(() => {
          resolve(merge({}, response, {
            actor: { name: this.name },
            object: { id: responseObject.id }, // Fabric ID
            target: { id: `${this.authority}/messages/${responseID}` },
            message_id: responseID // TODO: deprecate in favor of `object`
          }));
        });
      }).catch((error) => {
        console.error('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Trainer error:', error);
        reject(error);
      }); */

      /* console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Trainer request:', template);
      return this.trainer.query(template).then(async (response) => {
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Trainer response:', response);
        // Update database with completed response
        this.db('messages').where({ id: responseID }).update({
          status: 'ready',
          content: response.content,
          updated_at: this.db.fn.now()
        }).catch((error) => {
          console.error('could not update message:', error);
          reject(error);
        }).then(() => {
          if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Trainer response updated in database:', responseID);
          resolve(merge({}, response, {
            actor: { name: this.name },
            object: { id: responseObject.id }, // Fabric ID
            target: { id: `${this.authority}/messages/${responseID}` },
            message_id: responseID // TODO: deprecate in favor of `object`
          }));
        });
      }).catch((error) => {
        console.error('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Trainer error:', error);
        reject(error);
      }); */

      /*
        { ...this.settings.ollama, name: 'GOLIATH:QWEN', host: '10.0.0.1', model: 'qwen3:0.6b' },
        { ...this.settings.ollama, name: 'GOLIATH:BASE', host: '10.0.0.1', model: 'llama3.2' },
        { ...this.settings.ollama, name: 'GOLIATH:DEEPSEEK:LATEST', host: '10.0.0.1', model: 'deepseek-r1:latest' },
        { ...this.settings.ollama, name: 'GOLIATH:DEEPSEEK:32B', host: '10.0.0.1', model: 'deepseek-r1:32b' },
      */

      // Step B — parallel fan-out (Pool × N models, optional Trainer, primary Agent). Wall time capped by race below.
      const pipelineMs = Math.min(
        Number(request.timeout) > 0 ? Number(request.timeout) : PIPELINE_PARALLEL_MS,
        MAX_RESPONSE_TIME_MS
      );
      const pipelineTasks = buildPipelineFanOut(this, template, this.settings.pipeline || {});
      let responses = await Promise.race([
        Promise.allSettled(pipelineTasks),
        new Promise((resolve) => setTimeout(() => resolve(null), pipelineMs))
      ]);

      if (!responses) {
        console.warn('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', `Pipeline timed out after ${pipelineMs}ms; completing with primary agent only.`);
        try {
          const solo = await this.sensemaker.query({ ...template, stream: false });
          responses = [{ status: 'fulfilled', value: solo }];
        } catch (soloErr) {
          console.error('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Fallback sensemaker.query failed:', soloErr);
          return reject(soloErr);
        }
      }

      try {
        if (!responses || !responses.length) return reject(new Error('No responses from network.'));
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Responses:', responses);
        // Final Summary (actual answer)
        // TODO: stream answer as it comes back from backend (to clients subscribed to the conversation)
        // TODO: finalize WebSocket implementation
        // Filter and process responses
        const settled = responses.filter((x) => {
          return x.status === 'fulfilled' && x.value && typeof x.value.content === 'string';
        }).map((x) => {
          return { name: `ACTOR:${x.value.name || this.name}`, role: 'assistant', content: x.value.content };
        });

        for (let i = 0; i < settled.length; i++) {
          const response = settled[i];
          if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Response:', response);
          // Add to messages
          messages.push({ role: 'assistant', content: response.content });
        }

        // Step C — streamed final answer: signed Fabric frames + optional OpenAI SSE on request._openAiStream.
        const streamFinal = !request.tools;
        const sse = request._openAiStream;
        const openAiMeta = sse ? {
          id: sse.completionId,
          model: sse.model || this.settings.ollama?.model || 'sensemaker',
          created: sse.created || Math.floor(Date.now() / 1000)
        } : null;

        if (streamFinal) {
          const startPayload = { id: responseObject.id, conversation_id: request.conversation_id };
          chatStreamBridge.fabricStreamStart(this, startPayload);
          if (sse && openAiMeta) {
            chatStreamBridge.writeSseEvent(sse.res, chatStreamBridge.openAiChatCompletionChunk({
              id: openAiMeta.id,
              model: openAiMeta.model,
              created: openAiMeta.created,
              delta: { role: 'assistant' }
            }));
          }
        }

        const finalSummaryMs = Math.min(PIPELINE_FINAL_SUMMARY_MS, MAX_RESPONSE_TIME_MS);
        const summaryPromise = this.sensemaker.query({
          context: request.context,
          prompt: prompt,
          messages: messages,
          query: `${request.query}`,
          tools: request.tools,
          stream: streamFinal,
          onStreamChunk: streamFinal ? (delta) => {
            const chunk = { id: responseObject.id, conversation_id: request.conversation_id, content: delta };
            chatStreamBridge.fabricStreamChunk(this, chunk);
            if (sse && openAiMeta) {
              chatStreamBridge.writeSseEvent(sse.res, chatStreamBridge.openAiChatCompletionChunk({
                id: openAiMeta.id,
                model: openAiMeta.model,
                created: openAiMeta.created,
                delta: { content: delta }
              }));
            }
          } : undefined
        });

        let summary;
        try {
          summary = await Promise.race([
            summaryPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('PIPELINE_FINAL_TIMEOUT')), finalSummaryMs))
          ]);
        } catch (finalErr) {
          if (finalErr && finalErr.message === 'PIPELINE_FINAL_TIMEOUT') {
            console.warn('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', `Final summary timed out after ${finalSummaryMs}ms; using parallel responses only.`);
            const stitched = settled.map((s) => s.content).filter(Boolean).join('\n\n---\n\n');
            summary = {
              content: stitched || `${this.settings.name} could not finish in time. Please try again or shorten your question.`
            };
            if (streamFinal && sse && openAiMeta && summary.content) {
              chatStreamBridge.fabricStreamChunk(this, {
                id: responseObject.id,
                conversation_id: request.conversation_id,
                content: summary.content
              });
              chatStreamBridge.writeSseEvent(sse.res, chatStreamBridge.openAiChatCompletionChunk({
                id: openAiMeta.id,
                model: openAiMeta.model,
                created: openAiMeta.created,
                delta: { content: summary.content }
              }));
              chatStreamBridge.writeSseEvent(sse.res, chatStreamBridge.openAiChatCompletionChunk({
                id: openAiMeta.id,
                model: openAiMeta.model,
                created: openAiMeta.created,
                delta: {},
                finishReason: 'stop'
              }));
              chatStreamBridge.writeSseDone(sse.res);
              sse.res.end();
            }
          } else {
            throw finalErr;
          }
        }

        await this.db('messages').where({ id: responseID }).update({
          status: 'ready',
          content: summary.content,
          updated_at: this.db.fn.now()
        });

        if (streamFinal && sse && openAiMeta && !sse.res.writableEnded) {
          chatStreamBridge.writeSseEvent(sse.res, chatStreamBridge.openAiChatCompletionChunk({
            id: openAiMeta.id,
            model: openAiMeta.model,
            created: openAiMeta.created,
            delta: {},
            finishReason: 'stop'
          }));
          chatStreamBridge.writeSseDone(sse.res);
          sse.res.end();
        }

        resolve(merge({}, summary, {
          actor: { name: this.name },
          object: { id: responseObject.id },
          target: { id: `${this.authority}/messages/${responseID}` },
          message_id: responseID
        }));
      } catch (pipeErr) {
        reject(pipeErr);
      }
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

  async describeImage (image) {
    this.vision.query({
      query: 'Describe the image.',
      images: [image]
    })
  }

  async _getState () {
    if (this.settings.debug) console.debug('getting state...');
    // WARNING: this loads the int32 for every entity in the database
    const conversations = [] || await this.db('conversations').select('id');
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[STATE]', 'Conversations:', conversations.length);
    const documents = [] || await this.db('documents').select('id');
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[STATE]', 'Documents:', documents.length);

    // Replace the problematic query with a count query instead of fetching all records
    const inquiriesCount = { total: 0 } || await this.db('inquiries').count('id as total').first();
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[STATE]', 'Inquiries:', inquiriesCount.total);

    // Only fetch a limited number of inquiries if you need the actual records
    const recentInquiries = [] || await this.db('inquiries')
      .select('id', 'created_at', 'email')
      .orderBy('created_at', 'desc')
      .limit(100);

    const invitations = [] || await this.db('invitations').select('id', 'created_at', 'updated_at', 'status');
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[STATE]', 'Invitations:', invitations.length);
    const messages = [] || await this.db('messages').select('id');
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[STATE]', 'Messages:', messages.length);

    // User Analytics
    const users = [] || await this.db('users').select('id', 'username');
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[STATE]', 'Users:', users.length);

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
        total: inquiriesCount.total,
        content: recentInquiries
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
    // const other = await this._getUnprocessedDocumentStats();
    // const chunk = await this._getUnprocessedDocuments(limit);

    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[ETL]', 'Stats:', other, stats);

    const start = new Date();
    for (let i = 0; i < chunk.length; i++) {
      const instance = chunk[i];
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[ETL]', 'Processing case:', instance.title, `[${instance.id}]`);
      // const nativeEmbedding = await this._generateEmbedding(`[sensemaker/documents/${instance.id}] ${instance.title}`);
      const titleEmbedding = await this._generateEmbedding(instance.title);
      await this.db('documents').where('id', instance.id).update({ title_embedding_id: titleEmbedding.id });
      stats.processed++;
    }

    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[ETL]', 'Complete in ', (new Date().getTime() - now.getTime()) / 1000, 'seconds.');
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[ETL]', `Generated ${stats.processed} embeddings in ${(new Date().getTime() - start.getTime()) / 1000} seconds. (${stats.processed / ((new Date().getTime() - start.getTime()) / 1000)} embeddings per second)`);
    */
    return this;
  }

  async onJobCompleted (message) {
    const { job, result } = JSON.parse(message);
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE] Job completed:', job, result);

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
      if (this.key && this.key.private) messageTook.signWithKey(this.key);
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
            if (this.key && this.key.private) messageFile.signWithKey(this.key);
            this.http.broadcast(messageFile);
            break;
          case 'IngestDocument':
            this._handleDocumentIngested(job.params[0]);

            const document = await this.db.select('owner','fabric_id','title').from('documents').where({ id: job.params[0] }).first();
            queueMessage.creator = document.owner;
            queueMessage.fabric_id = document.fabric_id;
            queueMessage.title = document.title;
            const messageDocument = Message.fromVector([queueMessage.type, JSON.stringify(queueMessage)]);
            if (this.key && this.key.private) messageDocument.signWithKey(this.key);
            this.http.broadcast(messageDocument);
            break;
          default:
            if (this.settings.debug) console.debug('[SENSEMAKER:CORE] Unhandled complete Job Method:', job.method);
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
      if (this.key && this.key.private) messageTook.signWithKey(this.key);
      this.http.broadcast(messageTook);
    }
  }

  async query (query) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[QUERY]', 'Received query:', query);
    const collections = {
      documents: {}
    };

    const candidates = await Promise.allSettled([
      (new Promise((resolve, reject) => {
        setTimeout(reject, USER_QUERY_TIMEOUT_MS, new Error('Timeout!'));
      })),
      this._searchDocuments(query)
    ]);

    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[QUERY]', 'Candidates:', candidates);

    return candidates;
  }

  async restore () {
    const last = await this.changes._getLastLine();
    // TODO: load from STATE file
    return this;
  }

  async ingest (data) {
    // TODO: check for triggers

    await this.queue._addJob('ingest', [data]);
  }

  async prime () {
    if (!this.settings.ollama.preload) return { done: true, skipped: true };
    if (!this.settings.ollama.host) return { done: true };
    return new Promise((resolve, reject) => {
      if (this.settings.debug) console.debug('[SENSEMAKER]', 'Priming:', this.settings.ollama.model);
      fetch(`http${(this.settings.ollama.secure) ? 's' : ''}://${this.settings.ollama.host}:${this.settings.ollama.port}/api/generate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: this.settings.ollama.model })
      }).then(async (response) => {
        return response.json();
      }).then((json) => {
        if (this.settings.debug) console.debug('[SENSEMAKER]', 'Primed:', json);
        resolve(json);
      }).catch(reject);
    });
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
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Received search request:', request);
    let redisResults = { content: [] };
    try {
      redisResults = await this.trainer.search(request);
    } catch (error) {
      console.warn('[SENSEMAKER:CORE]', '[SEARCH]', 'Trainer vector search failed:', error.message || error);
    }
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Redis Results:', redisResults);
    const documents = await this._searchDocuments(request);
    // const people = await this._searchPeople(request);

    const elements = [];

    for (let i = 0; i < documents.length; i++) {
      const instance = documents[i];
      const element = { type: 'Document', content: instance };
      elements.push(element);
    }

    // Construct Results Object
    const results = {
      request: request,
      query: request.query,
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
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', '[CONVERSATIONS]', 'Found results:', results);
    }

    const messages = await this.db('messages').select('id').where('content', 'like', `%${request.query}%`);
    const conversations = await this.db('conversations').in('id', messages.map((message) => message.conversation_id)).paginate({
      perPage: PER_PAGE_DEFAULT,
      currentPage: 1
    });

    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', '[CONVERSATIONS]', 'Found conversations:', conversations);

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

  async setupAdmin () {
    return new Promise(async (resolve, reject) => {
      const user = os.userInfo();
      const adminUsername = process.env.ADMIN_USERNAME || user.username;
      const existing = await this.db('users').where({ username: adminUsername }).first();
      if (!existing) {
        // Use provided admin password or generate a random one
        const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(32).toString('base64');
        const salt = genSaltSync(BCRYPT_PASSWORD_ROUNDS);
        const hashed = hashSync(password, salt);
        const ids = await this.db('users').insert({ username: adminUsername, password: hashed, salt: salt, is_admin: true });
        this.admin = { id: ids[0], username: adminUsername };
        console.warn('[SENSEMAKER]', '[ADMIN]', 'Username:', adminUsername);
        if (process.env.ADMIN_PASSWORD) {
          console.warn('[SENSEMAKER]', '[ADMIN]', 'Password: Using provided ADMIN_PASSWORD environment variable');
        } else {
          console.warn('[SENSEMAKER]', '[ADMIN]', 'Password:', password);
          console.warn('[SENSEMAKER]', '[ADMIN]', 'Warning!  The password above will not be displayed again.');
        }
      } else {
        this.admin = { id: existing.id, username: existing.username };
        console.warn('[SENSEMAKER]', '[ADMIN]', 'Using existing admin user:', adminUsername);
      }
      resolve(this);
    });
  }

  async setupAgents () {
    const base = { model: 'sensemaker', name: 'Sensemaker' };
    const reference = new Actor(base);
    const agents = [
      { id: reference.id, ...base }
    ];

    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];

        if (!agent.id) {
          const sample = new Actor(agent);
          agent.id = sample.id;
        }

        const existing = await this.db('agents').where(agent).first();
        if (existing) continue;

        await this.db('agents').insert(agent);
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[AGENT]', 'Created:', agent);
      }

      resolve(this);
    });
  }

  async startBeacon () {
    const bitcoin = this.bitcoin || this.regtest;
    if (!bitcoin) {
      console.error('[SENSEMAKER:CORE]', '[BEACON]', 'No Bitcoin node available.');
      return this;
    }

    this.beacon.on('message', async (message) => {
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[BEACON]', 'Emitted message:', message);
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[BEACON]', 'Current Beacon state:', this.beacon.state);

      // Verify the message signature using root key
      if (message.signature) {
        const isValid = message.verifyWithKey(this._rootKey);
        if (!isValid) {
          console.error('[SENSEMAKER:CORE]', '[BEACON]', 'Invalid beacon signature!');
          return;
        }
      }

      switch (message['@type']) {
        case 'BEACON_EPOCH':
          try {
            const content = JSON.parse(message.body);
            if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[BEACON]', 'Parsed content:', content);
            this.clock = content.clock;
            this._state.clock = content.clock;
            this._state.content = merge({}, this.state.content, { clock: content.clock });
            this._state.content.beacon = merge({}, this.state.beacon, content.beacon);
            this._state.content.bitcoin = merge({}, this.state.bitcoin, content.bitcoin);
            this._state.content.bitcoin.balance = this.beacon._state.bitcoin.balance;
            this.commit();
          } catch (error) {
            console.error('[SENSEMAKER:CORE]', '[BEACON]', 'Error parsing message content:', error);
          }
          break;
        default:
          break;
      }
    });

    this.beacon.bitcoin = bitcoin;
    this.beacon.start();
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[BEACON]', 'Beacon started.');
    return this;
  }

  /**
   * Start the process.
   * @return {Promise} Resolves once the process has been started.
   */
  async start () {
    const self = this;

    // Load the state from disk
    await this.fs.start();

    this._state.content = merge({}, this.state, this.fs.state);
    this.commit();

    // Load HTML document from disk to serve from memory
    // TODO: add filesystem watcher for live updates (low priority)
    this.applicationString = fs.readFileSync('./assets/index.html').toString('utf8');
    this.bitcoinPDF = fs.readFileSync('./assets/bitcoin.pdf').toString('utf8');
    this.termsOfUse = fs.readFileSync('./contracts/terms-of-use.md').toString('utf8');

    await this.setupAdmin();
    await this.setupAgents();

    // Create all worker agents
    if (this.settings.debug) this.emit('debug', '[SENSEMAKER:CORE] Creating network:' + JSON.stringify(Object.keys(this.settings.agents)));

    for (const [name, agent] of Object.entries(this.settings.agents)) {
      const configuration = merge({}, agent, { name: name, debug: this.settings.debug });
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Creating network agent:', `[${(configuration.fabric) ? 'FABRIC' : (configuration.secure) ? 'HTTPS' : 'HTTP' }]`, name, configuration.host, configuration.port, configuration.secure);
      this.agents[name] = this.createAgent(configuration);
    }

    // Worker Methods
    // TODO: define these with a map / loop
    // Document Ingest
    this.queue._registerMethod('IngestDocument', async (...params) => {
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[QUEUE]', 'Ingesting document...', params);
      const document = await this.db('documents').where('id', params[0]).first();
      const ingested = await this.trainer.ingestDocument({
        content: JSON.stringify(document.content),
        metadata: {
          id: document.id,
          document_id: document.id,
          source_document_id: document.id,
          fabric_id: document.fabric_id,
          owner: document.owner,
          creator: document.creator,
          type: 'document'
        }
      }, 'document');
      return { status: 'COMPLETED', ingested };
    });

    // User Upload Ingest
    this.queue._registerMethod('IngestFile', IngestFile.bind(this), this);

    // Graph
    await this.graph.start();
    await this.graph.addActor({ name: 'sensemaker' });
    await this.graph.addActor({ name: 'agents' });

    // Trainer
    // this.sensemaker.attachDatabase(this.db);
    this.trainer.attachDatabase(this.db);

    try {
      await this.trainer.start();
    } catch (exception) {
      console.error('[SENSEMAKER:CORE]', '[REDIS]', 'Error starting Trainer:', exception);
      console.warn('[SENSEMAKER:CORE]', '[REDIS]', 'Continuing without Trainer - embedding features will be unavailable');
      // Don't exit - allow system to run without trainer/embeddings
    }

    if (this.settings.redis) {
      this.redis = createClient({
        username: this.settings.redis.username,
        password: this.settings.redis.password,
        socket: this.settings.redis
      });

      // Handle Redis connection events
      this.redis.on('error', (err) => {
        console.error('[SENSEMAKER:REDIS]', 'Redis client error:', err);
      });

      this.redis.on('connect', () => {
        if (this.settings.debug) console.debug('[SENSEMAKER:REDIS]', 'Redis client connected');
      });

      this.redis.on('end', () => {
        if (this.settings.debug) console.debug('[SENSEMAKER:REDIS]', 'Redis client connection closed');
      });

      // Connect to Redis
      await this.redis.connect().catch((err)=> {
        console.error('[SENSEMAKER:REDIS]', 'Failed to connect to Redis:', err);
        process.exit(1);
      });

      // Redis client for subscribing to channels
      this.redisSubscriber = createClient({
        username: this.settings.redis.username,
        password: this.settings.redis.password,
        socket: this.settings.redis
      });

      if (this.settings.debug) console.debug('[SENSEMAKER:REDIS]', 'Created Redis subscriber.');

      // Connect subscriber and set up handlers
      await this.redisSubscriber.connect().then(() => {
        this.redisSubscriber.subscribe('job:completed', this.onJobCompleted.bind(this));
        this.redisSubscriber.subscribe('job:taken', this.onJobTaken.bind(this));
      }).catch((err) => {
        console.error('[SENSEMAKER:REDIS]', 'Failed to connect Redis subscriber:', err);
        process.exit(1);
      });
    }

    // Pool
    try {
      await this.pool.start();
    } catch (exception) {
      console.error('[SENSEMAKER:CORE]', '[POOL]', 'Error starting pool:', exception);
      process.exit(1);
    }

    // Queue
    try {
      await this.queue.start();
    } catch (exception) {
      console.error('[SENSEMAKER:CORE]', '[REDIS]', 'Error starting queue:', exception);
      process.exit(1);
    }

    // Action Model
    try {
      await this.coordinator.start();
    } catch (exception) {
      console.error('[SENSEMAKER:CORE]', '[COORDINATOR]', 'Error starting Coordinator:', exception);
    }

    // Load Triggers
    await this.syncTriggers();

    /* this.db.on('error', (...error) => {
      console.error('[SENSEMAKER:CORE]', '[DB]', '[ERROR]', ...error);
    }); */

    // Register Services
    // await this._registerService('webhooks', WebHooks);
    await this._registerService('bitcoin', Bitcoin);
    // await this._registerService('discord', Discord);
    // await this._registerService('github', GitHub);
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
      if (this.settings.debug) console.debug('[WORKER]', 'Scanning Local:', params);
      const state = this.fs.synchronize();
      if (this.settings.debug) console.debug('[WORKER]', 'Local State:', state);
    });

    this.worker.register('ScanRemotes', async (...params) => {
      if (this.settings.debug) this.emit('debug', `[WORKER] Scanning Remotes: ${params}`);
      const sources = await this.db('sources')
        .select('id', 'name', 'content')
        .where({ status: 'active' })
        .where(function () {
          this.whereRaw('last_retrieved < NOW() - INTERVAL 1 DAY').where({ recurrence: 'daily' })
            .orWhereRaw('last_retrieved < NOW() - INTERVAL 1 WEEK').where({ recurrence: 'weekly' })
            .orWhereRaw('last_retrieved < NOW() - INTERVAL 1 MONTH').where({ recurrence: 'monthly' })
            .orWhereRaw('last_retrieved < NOW() - INTERVAL 1 YEAR').where({ recurrence: 'yearly' })
            .orWhere('last_retrieved', null);
        })
        .orderBy('last_retrieved', 'asc');

      if (this.settings.debug) this.emit('debug', `remotes to scan: ${JSON.stringify(sources)}`);
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        await this.syncSource(source.id).catch((exception) => {
          console.error('[WORKER]', 'Error syncing source:', source, exception);
        });
      }

      if (this.discord) {
        this.discord.syncGuilds();
        this.discord.syncAllChannels();

        for (let i = 0; i < this.discord.guilds.length; i++) {
          const guild = this.discord.guilds[i];
          // console.debug('[WORKER]', 'Server has Discord guild:', guild);
          const members = await this.discord.listGuildMembers(guild.id);
          // console.debug('[WORKER]', 'Guild Members:', members);
        }

        for (let i = 0; i < this.discord.channels.length; i++) {
          const channel = this.discord.channels[i];
          let members = [];
          // console.debug('[WORKER]', 'Server has Discord channel:', channel);
          try {
            const candidates = await this.discord.listChannelMembers(channel.id);
            // console.debug('[WORKER]', 'Channel Members:', candidates);
          } catch (exception) {
            console.error('[WORKER]', 'Error listing channel members:', exception);
          }
        }
      }
    });

    // Worker Events
    this.worker.on('debug', (...debug) => { if (this.settings.debug) console.debug(...debug); });
    this.worker.on('log', (...log) => { if (this.settings.debug) console.log(...log); });
    this.worker.on('warning', (...warning) => console.warn(...warning));
    this.worker.on('error', (...error) => console.error(...error));

    this.sensemaker.on('document', this._handleLocalDocument.bind(this));

    // Bitcoin Events
    if (this.bitcoin) {
      if (this.settings.debug) this.bitcoin.on('debug', (...debug) => console.debug('[BITCOIN]', '[DEBUG]', ...debug));
      this.bitcoin.on('error', (...error) => console.error('[BITCOIN]', '[ERROR]', ...error));
      this.bitcoin.on('log', (...log) => { if (this.settings.debug) console.log('[BITCOIN]', ...log); });
      this.bitcoin.on('warning', (...warning) => console.warn('[BITCOIN]', '[WARNING]', ...warning));
      this.bitcoin.on('transaction', (transaction) => {
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Received Bitcoin transaction:', transaction);
        switch (transaction.type) {
          case 'hash':
            if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Received Bitcoin transaction hash:', transaction.content);
            // Create message for WebSocket clients
            const txidMessage = {
              type: 'BitcoinTXID',
              content: transaction.content,
              timestamp: Date.now()
            };

            // Broadcast TXID to all connected clients
            const hashMessage = Message.fromVector(['BitcoinTXID', JSON.stringify(txidMessage)]);
            if (this.key && this.key.private) hashMessage.signWithKey(this.key);
            this.http.broadcast(hashMessage);
            break;
          case 'raw':
            if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Received raw Bitcoin transaction:', transaction.content);
              // Create message for WebSocket clients
              const bitcoinMessage = {
                type: 'BitcoinTransaction',
                content: transaction.content,
                timestamp: Date.now()
              };

              // Broadcast to all connected clients
              const message = Message.fromVector(['BitcoinTransaction', JSON.stringify(bitcoinMessage)]);
              if (this.key && this.key.private) message.signWithKey(this.key);
              this.http.broadcast(message);
            break;
          default:
            console.warn('[SENSEMAKER:CORE]', 'Unknown Bitcoin transaction type:', transaction.type);
            break;
        }
      });
    }

    // Email Events
    if (this.email) {
      if (this.settings.debug) this.email.on('debug', (...debug) => console.debug('[EMAIL]', ...debug));
      this.email.on('log', (...log) => { if (this.settings.debug) console.log('[EMAIL]', ...log); });
      this.email.on('warning', (...warning) => console.warn('[EMAIL]', ...warning));
      this.email.on('error', (...error) => console.error('[EMAIL]', ...error));
    }

    // Fabric Events
    if (this.fabric) {
      this.fabric.on('error', this._handleFabricError.bind(this));
      // this.fabric.on('warning', (...warning) => console.warn(...warning));
      // this.fabric.on('debug', this._handleFabricDebug.bind(this));
      // this.fabric.on('log', (...log) => console.log(...log));
      this.fabric.on('activity', this._handleFabricActivity.bind(this));
      this.fabric.on('document', this._handleFabricDocument.bind(this));
      this.fabric.on('message', this._handleFabricMessage.bind(this));
      this.fabric.on('person', this._handleFabricPerson.bind(this));
    }

    if (this.discord) {
      this.discord.on('activity', this._handleDiscordActivity.bind(this));
      this.discord.on('ready', this._handleDiscordReady.bind(this));
      this.discord.on('error', this._handleDiscordError.bind(this));
      this.discord.on('log', this._handleDiscordLog.bind(this));
      this.discord.on('debug', this._handleDiscordDebug.bind(this));
    }

    // OpenAI Events
    if (this.openai) {
      this.openai.on('error', this._handleOpenAIError.bind(this));
      this.openai.on('MessageStart', this._handleOpenAIMessageStart.bind(this));
      this.openai.on('MessageChunk', this._handleOpenAIMessageChunk.bind(this));
      this.openai.on('MessageEnd', this._handleOpenAIMessageEnd.bind(this));
      this.openai.on('MessageWarning', this._handleOpenAIMessageWarning.bind(this));
    }

    // Load models
    await this.searcher.start();
    await this.summarizer.start();

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
    if (this.bitcoin) await this.bitcoin.start();
    await this._startPlaynetBitcoinIfPresent();
    if (this.regtest) {
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REGTEST]', 'Starting regtest...');
      if (this.settings.debug) this.regtest.on('debug', (...debug) => console.debug('[BITCOIN:REGTEST]', '[DEBUG]', ...debug));
      this.regtest.on('error', (...error) => console.error('[BITCOIN:REGTEST]', '[ERROR]', ...error));
      this.regtest.on('log', (...log) => { if (this.settings.debug) console.log('[BITCOIN:REGTEST]', ...log); });
      this.regtest.on('warning', (...warning) => console.warn('[BITCOIN:REGTEST]', '[WARNING]', ...warning));
      this.regtest.on('transaction', (transaction) => {
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Received Bitcoin transaction:', transaction);
        switch (transaction.type) {
          case 'hash':
            if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Received Bitcoin transaction hash:', transaction.content);
            // Create message for WebSocket clients
            const txidMessage = {
              type: 'BitcoinTXID',
              content: transaction.content,
              timestamp: Date.now()
            };

            // Broadcast TXID to all connected clients
            const hashMessage = Message.fromVector(['BitcoinTXID', JSON.stringify(txidMessage)]);
            if (this.key && this.key.private) hashMessage.signWithKey(this.key);
            this.http.broadcast(hashMessage);
            break;
          case 'raw':
            if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', 'Received raw Bitcoin transaction:', transaction.content);
              // Create message for WebSocket clients
              const regtestMessage = {
                type: 'BitcoinTransaction',
                content: transaction.content,
                timestamp: Date.now()
              };

              // Broadcast to all connected clients
              const message = Message.fromVector(['BitcoinTransaction', JSON.stringify(regtestMessage)]);
              if (this.key && this.key.private) message.signWithKey(this.key);
              this.http.broadcast(message);
            break;
          default:
            console.warn('[SENSEMAKER:CORE]', 'Unknown Bitcoin transaction type:', transaction.type);
            break;
        }
      });

      await this.regtest.start();

      const lconfig = {
        debug: true,
        managed: true,
        mode: 'socket',
        network: 'regtest',
        datadir: './stores/lightning-regtest',
        username: this.regtest.settings.username,
        password: this.regtest.settings.password,
        socket: 'lightningd.sock',
        bitcoin: {
          username: this.regtest.settings.username,
          password: this.regtest.settings.password,
          network: this.regtest.settings.network,
          host: this.regtest.settings.host,
          rpcport: this.regtest.settings.rpcport,
          datadir: this.regtest.settings.datadir
        }
      };

      if (this.settings.debug) console.debug('lightning config:', lconfig);
      this.lightning = new Lightning(lconfig);

      if (this.settings.debug) this.lightning.on('debug', (...debug) => console.debug('[LIGHTNING]', ...debug));
      this.lightning.on('error', (...error) => console.error('[LIGHTNING]', ...error));
      this.lightning.on('log', (...log) => { if (this.settings.debug) console.log('[LIGHTNING]', ...log); });
      this.lightning.on('warning', (...warning) => console.warn('[LIGHTNING]', '[WARNING]', ...warning));

      try {
        // await this.lightning.start();
      } catch (exception) {
        console.error('[SENSEMAKER:CORE]', '[LIGHTNING]', 'Error starting Lightning:', exception);
      }
    }

    // Register HTTP Methods
    this.http._registerMethod('getUnusedAddress', async (request) => {
      const bitcoin = this.bitcoin || this.regtest;
      if (!bitcoin) throw new Error('No Bitcoin node available.');

      const address = await bitcoin.getUnusedAddress();
      if (!address) throw new Error('No unused address available.');
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[HTTP]', 'Generated unused address:', address);

      const response = {
        address: address,
        network: bitcoin.network
      };

      return response;
    });

    this.http._registerMethod('connectPeer', async (request) => {
      if (!this.fabric) throw new Error('No Fabric peer available.');

      const { pubkey, host, port } = request.params && request.params[0] ? request.params[0] : {};
      if (!host) throw new Error('Host is required for peer connection.');

      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[HTTP]', 'Attempting to connect to peer:', { host, port, pubkey });

      try {
        // Format the connection string for Fabric peer
        const targetPort = port || 7777; // Default Fabric P2P port
        const connectionString = pubkey ? `${pubkey}@${host}:${targetPort}` : `${host}:${targetPort}`;

        // Use the Fabric peer's _connect method
        this.fabric._connect(connectionString);
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[HTTP]', 'Successfully initiated connection to peer:', connectionString);

        const response = {
          success: true,
          peer: {
            host: host,
            port: targetPort,
            pubkey: pubkey || null,
            connected: true, // Optimistically assume success for now
            address: connectionString
          },
          message: `Connection initiated to ${connectionString}`
        };

        return response;
      } catch (error) {
        console.error('[SENSEMAKER:CORE]', '[HTTP]', 'Failed to connect to peer:', error);

        const response = {
          success: false,
          error: error.message || 'Failed to connect to peer',
          peer: {
            host: host,
            port: port || 7777,
            pubkey: pubkey || null,
            connected: false
          }
        };

        return response;
      }
    });

    this.http._registerBitcoin(this.bitcoin || this.regtest);
    if (this.email) await this.email.start();

    if (this.rsi) {
      this.rsi.on('error', (...error) => {
        return; // silence for now.
      });

      await this.rsi.start();
    }
    // if (this.github) await this.github.start();
    if (this.discord) {
      try {
        await this.discord.start();
      } catch (exception) {
        console.error('[SENSEMAKER:CORE]', '[DISCORD]', 'Error starting Discord:', exception);
      }
    }

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
        this.worker.addJob({
          type: 'ScanRemotes',
          params: []
        });
      }, this.settings.crawlDelay);
    }

    this._slowcrawler = setInterval(this.generateBlock.bind(this), SNAPSHOT_INTERVAL); // 10 minutes

    // Add Defined Routes
    this._addAllRoutes();

    // TODO: migrate these to `routes` setting
    // TODO: migrate these to @fabric/core using "Resources"
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

    // TODO: set this as default behavior in @fabric/http
    this.http._addRoute('OPTIONS', '/documents', async (req, res) => {
      const types = [
        // TODO: declare all Document types
        { name: 'Text', code: ((v) => v).toString() },
        { name: 'Markdown', code: ((v) => v).toString(), description: 'Markdown formatted text.' },
        { name: 'HTML', code: ((v) => v).toString(), description: 'HTML document.' },
        { name: 'List', code: ((v) => v).toString(), description: 'Structured list of items.' },
        { name: 'Folder', code: ((v) => v).toString(), description: 'Collection of documents.' },
        { name: 'Graph', code: ((v) => v).toString(), description: 'Directed graph.' },
        // { name: 'Contract', code: ((v) => v).toString(), description: 'Fabric contract.' },
        // { name: 'Image', code: ((v) => v).toString() }
      ];

      const options = {
        type: 'Resource',
        content: {
          name: 'Documents',
          description: 'List of all documents in the system.',
          methods: ['GET', 'POST'],
          properties: {
            id: { type: 'string', description: 'Unique identifier for the document.' },
            title: { type: 'string', description: 'Title of the document.' },
            owner: { type: 'string', description: 'Owner of the document.' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation date of the document.' }
          },
          types: types,
        }
      };

      res.send(options);
    });

    // API
    this.http._addRoute('POST', '/v1/chat/completions', ROUTES.messages.createCompletion.bind(this));

    // Ollama-native HTTP mirror (drop-in for clients expecting Ollama's /api/*)
    this.http._addRoute('GET', '/api/tags', ROUTES.ollama.tags.bind(this));
    this.http._addRoute('GET', '/api/version', ROUTES.ollama.version.bind(this));
    this.http._addRoute('POST', '/api/chat', ROUTES.ollama.chat.bind(this));
    this.http._addRoute('POST', '/api/generate', ROUTES.ollama.generate.bind(this));

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

    // Health (deep checks — may be slow; use /metrics/live for load balancers / Docker)
    this.http._addRoute('GET', '/metrics/live', this._handleLiveRequest.bind(this));
    this.http._addRoute('GET', '/metrics/health', this._handleHealthRequest.bind(this));

    // Models
    this.http._addRoute('GET', '/models', ROUTES.models.list.bind(this));

    // Activities
    this.http._addRoute('GET', '/activities', ROUTES.activities.list.bind(this));
    this.http._addRoute('GET', '/activities/:id', ROUTES.activities.view.bind(this));

    // Agents
    this.http._addRoute('POST', '/agents', ROUTES.agents.create.bind(this));
    this.http._addRoute('GET', '/agents', ROUTES.agents.list.bind(this));
    this.http._addRoute('GET', '/agents/:id', ROUTES.agents.view.bind(this));

    // Alerts (internal)
    this.http._addRoute('GET', '/alerts', ROUTES.alerts.list.bind(this));
    this.http._addRoute('PATCH', '/alerts/:id', ROUTES.alerts.update.bind(this));

    // Files
    // TODO: use proper API to add this route
    this.http.express.post('/files', this.uploader.single('file'), this._userMiddleware.bind(this), ROUTES.files.create.bind(this));
    this.http._addRoute('GET', '/files/:id/download', ROUTES.files.serve.bind(this));
    this.http._addRoute('GET', '/files', ROUTES.files.list.bind(this));
    // this.http._addRoute('GET', '/files/user/:id', ROUTES.files.list.bind(this));
    this.http._addRoute('GET', '/files/:id', ROUTES.files.view.bind(this));
    // this.http._addRoute('GET', '/files/find/:filename', ROUTES.files.find.bind(this));

    // Uploads
    this.http._addRoute('GET', '/uploads', ROUTES.uploads.listUploads.bind(this));

    // Products
    this.http._addRoute('GET', '/features', ROUTES.products.listFeatures.bind(this));
    this.http._addRoute('GET', '/products', ROUTES.products.list.bind(this));

    // Blobs
    this.http._addRoute('GET', '/blobs/:id', ROUTES.blobs.view.bind(this));
    this.http._addRoute('META', '/blobs/:id', ROUTES.blobs.meta.bind(this));

    // Contracts
    this.http._addRoute('GET', '/contracts', ROUTES.contracts.list.bind(this));
    this.http._addRoute('GET', '/contracts/:id', ROUTES.contracts.view.bind(this));

    // Documents
    this.http._addRoute('POST', '/documents', ROUTES.documents.create.bind(this));
    this.http._addRoute('GET', '/documents/:fabricID', ROUTES.documents.view.bind(this));
    this.http._addRoute('PATCH', '/documents/:fabricID', ROUTES.documents.edit.bind(this));
    this.http._addRoute('DELETE', '/documents/:fabricID', ROUTES.documents.delete.bind(this));
    this.http._addRoute('GET', '/conversations/documents/:id', ROUTES.documents.newConversation.bind(this));
    this.http._addRoute('GET', '/documents/:fabricID/commits/:commitID', ROUTES.documents.getCommit.bind(this));

    // Groups
    this.http._addRoute('GET', '/groups', ROUTES.groups.list.bind(this));
    this.http._addRoute('GET', '/groups/:id', ROUTES.groups.view.bind(this));
    this.http._addRoute('POST', '/groups', ROUTES.groups.create.bind(this));
    this.http._addRoute('POST', '/groups/:id/members', ROUTES.groups.add_group_member.bind(this));

    // Wallet
    this.http._addRoute('POST', '/keys', ROUTES.keys.create.bind(this));
    this.http._addRoute('GET', '/keys', ROUTES.keys.list.bind(this));
    // this.http._addRoute('GET', '/keys/:id', ROUTES.keys.view.bind(this));

    // Memories
    this.http._addRoute('GET', '/memories', ROUTES.memories.list.bind(this));
    this.http._addRoute('GET', '/memories/:id', ROUTES.memories.view.bind(this));

    // Peers
    this.http._addRoute('POST', '/peers', ROUTES.peers.create.bind(this));
    this.http._addRoute('GET', '/peers', ROUTES.peers.list.bind(this));
    this.http._addRoute('GET', '/peers/:id', ROUTES.peers.view.bind(this));

    // Sources
    this.http._addRoute('POST', '/sources', ROUTES.sources.create.bind(this));
    this.http._addRoute('GET', '/sources', ROUTES.sources.list.bind(this));
    this.http._addRoute('GET', '/sources/:id', ROUTES.sources.view.bind(this));
    this.http._addRoute('GET', '/sources/:id/history', ROUTES.sources.history.bind(this));

    // Tasks
    this.http._addRoute('POST', '/tasks', ROUTES.tasks.create.bind(this));
    this.http._addRoute('GET', '/tasks', ROUTES.tasks.list.bind(this));
    this.http._addRoute('GET', '/tasks/:id', ROUTES.tasks.view.bind(this));
    this.http._addRoute('PATCH', '/tasks/:id', ROUTES.tasks.edit.bind(this));

    // Users
    this.http._addRoute('GET', '/users', ROUTES.users.list.bind(this));
    this.http._addRoute('GET', '/users/:username', ROUTES.users.view.bind(this));
    // TODO: switch to PATCH `/users/:username`
    this.http._addRoute('PATCH', '/users/username', ROUTES.users.editUsername.bind(this)); //this one is for admin to change other user's username
    this.http._addRoute('PATCH', '/users/email', ROUTES.users.editEmail.bind(this)); //this one is for admin to change other user's email

    // Services
    // TODO: finish Fabric service workup
    this.http._addRoute('POST', '/services/feedback', this._handleFeedbackRequest.bind(this));
    this.http._addRoute('GET', '/services/bitcoin', this._handleBitcoinStatusRequest.bind(this));
    this.http._addRoute('GET', '/services/bitcoin/blocks', ROUTES.services.bitcoin.blocks.list.bind(this));
    this.http._addRoute('GET', '/services/bitcoin/blocks/:blockhash', ROUTES.services.bitcoin.blocks.view.bind(this));
    this.http._addRoute('GET', '/services/bitcoin/transactions', ROUTES.services.bitcoin.transactions.list.bind(this));
    this.http._addRoute('GET', '/services/bitcoin/transactions/:txhash', ROUTES.services.bitcoin.transactions.view.bind(this));
    this.http._addRoute('GET', '/services/discord', this._handleDiscordStatusRequest.bind(this));
    this.http._addRoute('GET', '/services/discord/guilds', ROUTES.services.discord.guilds.list.bind(this));
    this.http._addRoute('GET', '/services/discord/guilds/:guildid', ROUTES.services.discord.guilds.view.bind(this));
    this.http._addRoute('GET', '/services/discord/channels', ROUTES.services.discord.channels.list.bind(this));
    this.http._addRoute('GET', '/services/discord/channels/:id', ROUTES.services.discord.channels.view.bind(this));
    this.http._addRoute('GET', '/services/discord/voice', ROUTES.services.discord.voice.snapshot.bind(this));
    this.http._addRoute('GET', '/services/discord/users', ROUTES.services.discord.users.list.bind(this));
    this.http._addRoute('GET', '/services/discord/users/:id', ROUTES.services.discord.users.view.bind(this));
    this.http._addRoute('GET', '/services/discord/authorize', this._handleDiscordAuthorizeRequest.bind(this));
    this.http._addRoute('GET', '/services/discord/revoke', this._handleDiscordRevokeRequest.bind(this));
    this.http._addRoute('GET', '/services/fabric/documents/:fabricID', ROUTES.documents.view.bind(this));
    this.http._addRoute('GET', '/services/fabric', this._handleFabricStatusRequest.bind(this));
    this.http._addRoute('GET', '/services/disk', ROUTES.services.disk.list.bind(this));
    this.http._addRoute('GET', '/services/disk/:path', ROUTES.services.disk.view.bind(this));
    this.http._addRoute('GET', '/services/github', this._handleGitHubStatusRequest.bind(this));

    if (this.rsi) {
      this.http._addRoute('GET', '/services/star-citizen', this.rsi.handleGenericRequest.bind(this));
      this.http._addRoute('POST', '/services/star-citizen', this.rsi.handleGenericRequest.bind(this));
      this.http._addRoute('GET', '/services/star-citizen/activities', this.rsi.handleGenericRequest.bind(this));
      this.http._addRoute('POST', '/services/star-citizen/activities', ROUTES.services.rsi.activities.create.bind(this));
    }

    // Feedback
    this.http._addRoute('POST', '/feedback', ROUTES.feedback.create.bind(this));

    // Redis Queue
    // TODO: remap to /services/queue
    this.http._addRoute('GET', '/redis/queue', ROUTES.redis.listQueue.bind(this));
    this.http._addRoute('PATCH', '/redis/queue', ROUTES.redis.clearQueue.bind(this));

    // Workers API: local queue + future Fabric work contracts (paid parallel execution)
    this.http._addRoute('GET', '/workers/state', ROUTES.workers.state.bind(this));
    this.http._addRoute('GET', '/workers/playnet-receive-address', ROUTES.workers.playnetReceiveAddress.bind(this));
    this.http._addRoute('POST', '/workers/donate-playnet', ROUTES.workers.donatePlaynet.bind(this));

    // Inquiries
    this.http._addRoute('POST', '/inquiries', ROUTES.inquiries.create.bind(this));
    this.http._addRoute('GET', '/inquiries', ROUTES.inquiries.list.bind(this));
    this.http._addRoute('DELETE', '/inquiries/:id', ROUTES.inquiries.delete.bind(this));

    // Invitations
    this.http._addRoute('POST', '/invitations', ROUTES.invitations.create.bind(this) );
    this.http._addRoute('PATCH', '/invitations/:id', ROUTES.invitations.resendInvitation.bind(this));
    this.http._addRoute('GET', '/invitations/:id', ROUTES.invitations.view.bind(this));
    this.http._addRoute('GET', '/invitations', ROUTES.invitations.list.bind(this));
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
    this.http._addRoute('GET', '/sessions/current', ROUTES.sessions.current.bind(this));

    // TODO: fix these routes
    this.http._addRoute('POST', '/passwordChange', ROUTES.account.changePassword.bind(this));
    this.http._addRoute('POST', '/usernameChange', ROUTES.account.changeUsername.bind(this));
    this.http._addRoute('POST', '/passwordReset', ROUTES.account.resetPassword.bind(this));
    this.http._addRoute('POST', '/resettokencheck', ROUTES.account.checkResetToken.bind(this));
    this.http._addRoute('POST', '/passwordRestore', ROUTES.account.restorePassword.bind(this));

    // Triggers
    this.http._addRoute('GET', '/triggers', ROUTES.triggers.list.bind(this));
    this.http._addRoute('POST', '/triggers', ROUTES.triggers.create.bind(this));
    this.http._addRoute('PATCH', '/triggers/:id', ROUTES.triggers.update.bind(this));
    this.http._addRoute('DELETE', '/triggers/:id', ROUTES.triggers.delete.bind(this));

    // TODO: check logic of PATCH, any other routes conflict?
    // route to edit a conversation (title, pinned status, etc.)
    this.http._addRoute('PATCH', '/conversations/:id', ROUTES.conversations.edit.bind(this));
    this.http._addRoute('GET', '/statistics', ROUTES.statistics.list.bind(this));
    this.http._addRoute('GET', '/conversations', ROUTES.conversations.list.bind(this));
    this.http._addRoute('GET', '/conversations/:id', ROUTES.conversations.getConversationsByID.bind(this));
    this.http._addRoute('GET', '/people', ROUTES.people.list.bind(this));
    this.http._addRoute('GET', '/people/:fabricID', ROUTES.people.view.bind(this));
    this.http._addRoute('GET', '/documents', ROUTES.documents.list.bind(this));
    this.http._addRoute('GET', '/jobs', ROUTES.jobs.list.bind(this));
    this.http._addRoute('GET', '/messages', ROUTES.messages.getMessages.bind(this));
    this.http._addRoute('GET', '/topics', ROUTES.topics.list.bind(this));
    this.http._addRoute('GET', '/topics/:id', ROUTES.topics.view.bind(this));
    this.http._addRoute('GET', '/statistics/admin', ROUTES.statistics.admin.bind(this));
    this.http._addRoute('GET', '/statistics/accuracy', ROUTES.statistics.getAccuracy.bind(this));
    this.http._addRoute('GET', '/statistics/sync', ROUTES.statistics.sync.bind(this));
    this.http._addRoute('GET', '/settings/admin', ROUTES.admin.overview.bind(this));
    this.http._addRoute('GET', '/settings/admin/overview', ROUTES.admin.overview.bind(this));
    this.http._addRoute('GET', '/settings/admin/settings', ROUTES.admin.settings.bind(this));
    this.http._addRoute('GET', '/settings/admin/users', ROUTES.admin.users.bind(this));
    this.http._addRoute('GET', '/settings/admin/growth', ROUTES.admin.growth.bind(this));
    this.http._addRoute('GET', '/settings/admin/conversations', ROUTES.admin.conversations.bind(this));
    this.http._addRoute('GET', '/settings/admin/services', ROUTES.admin.services.bind(this));
    this.http._addRoute('GET', '/settings/admin/design', ROUTES.admin.design.bind(this));
    this.http._addRoute('PATCH', '/settings/compliance', ROUTES.settings.updateCompliance.bind(this));
    this.http._addRoute('GET', '/settings', ROUTES.settings.list.bind(this));
    this.http._addRoute('GET', '/settings/:setting', ROUTES.settings.get.bind(this));
    this.http._addRoute('PUT', '/settings/:setting', ROUTES.settings.edit.bind(this));
    this.http._addRoute('POST', '/reviews', ROUTES.reviews.create.bind(this));
    this.http._addRoute('POST', '/messages', ROUTES.messages.create.bind(this));

    // TODO: attach old message ID to a new message ID, send `regenerate_requested` to true
    this.http._addRoute('PATCH', '/messages/:id', ROUTES.messages.regenerate.bind(this));
    this.http._addRoute('POST', '/announcements', ROUTES.announcements.create.bind(this));
    this.http._addRoute('GET', '/announcements', ROUTES.announcements.list.bind(this));
    this.http._addRoute('GET', '/announcements/latest', ROUTES.announcements.latest.bind(this));
    this.http._addRoute('PATCH', '/announcements/:id', ROUTES.announcements.edit.bind(this));

    // "The Changelog"
    // Stub for the news hub.
    this.http._addRoute('GET', '/updates', (req, res, next) => {
      res.send(this.applicationString);
    });

    // Alias: UI "Network" uses /peers; some links or bookmarks use /network.
    this.http._addRoute('GET', '/network', (req, res) => {
      res.send(this.applicationString);
    });

    // await this._startAllServices();

    // Listen for HTTP events, if enabled
    if (this.settings.http.listen) this.trust(this.http);

    // Always trust the local agent
    this.trust(this.fabric);

    // Queue up a verification job
    // this.queue._addJob({ method: 'verify', params: [] });

    // Create a heartbeat
    this._heart = setInterval(this.tick.bind(this), this.settings.interval);

    // Start HTTP, if enabled
    if (this.settings.http.listen) await this.http.start();
    if (this.settings.verify) await this._runFixtures();

    // Add 404 handler as the last route
    this.http.express.use('*', ROUTES.errors.notFound.bind(this));

    // Fabric Network
    if (this.settings.fabric && this.settings.fabric.enable) await this.fabric.start();

    // Finally, start the beacon
    await this.startBeacon();

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
    // this.alert(`Sensemaker started.  Agent ID: ${this.id}`);

    // Benchmarking
    if (this.settings.benchmark) {
      return this.stop();
    }

    // return the instance!
    return this;
  }

  /**
   * Stop the process.
   * @return {Promise} Resolves once the process has been stopped.
   */
  async stop () {
    this.status = 'STOPPING';

    if (this.activeWorkerQueue) this.activeWorkerQueue.stop();

    // Stop HTTP Listener
    if (this.http) await this.http.stop();

    // Stop Fabric Listener
    if (this.fabric) await this.fabric.stop();
    if (this.playnet && this.playnet.bitcoin) await this.playnet.bitcoin.stop();
    if (this.bitcoin) await this.bitcoin.stop();
    if (this.regtest) {
      if (this.lightning) await this.lightning.stop();
      await this.regtest.stop();
    }

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

    if (this.openai) await this.openai.stop();
    if (this.email) await this.email.stop();

    // Notify
    this.status = 'STOPPED';
    this.emit('stopped', {
      id: this.id,
      status: this.status
    });

    // Force exit after a shorter timeout (skip under test so Mocha can report failures)
    if (process.env.NODE_ENV !== 'test') {
      setTimeout(() => {
        // why();
        console.warn('[SENSEMAKER:CORE]', 'Forcing exit after timeout...');
        process.exit(0);
      }, 5000);
    }

    return this;
  }

  async sync () {
    await this.fs.synchronize();
    return this;
  }

  /**
   * Synchronize a remote {@link Source} by ID.
   * @param {Hash256} id - The ID of the source to sync.
   * @returns {Promise}
   */
  async syncSource (id) {
    return new Promise(async (resolve, reject) => {
      try {
        const source = await this.db('sources').where({ id }).first();
        if (!source) {
          throw new Error('Source not found.');
        }
        const link = source.content;
        const now = new Date();

        let response;
        try {
          response = await fetch(link);
        } catch (exception) {
          const errorMessage = `Failed to fetch: ${exception.message}`;
          console.error('[SENSEMAKER:CORE]', '[SYNC]', 'Fetch error:', errorMessage);

          // Update source with error
          await this.db('sources').update({
            updated_at: toMySQLDatetime(now),
            last_error: errorMessage
          }).where({ id });

          return reject(exception);
        }

        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SYNC]', 'Response:', response);

        if (!response) {
          const errorMessage = 'No response from source.';
          await this.db('sources').update({
            updated_at: toMySQLDatetime(now),
            last_error: errorMessage
          }).where({ id });
          return reject(new Error(errorMessage));
        }

        // Check if response is successful
        if (!response.ok) {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          console.error('[SENSEMAKER:CORE]', '[SYNC]', 'HTTP error:', errorMessage);

          // Update source with error
          await this.db('sources').update({
            updated_at: toMySQLDatetime(now),
            last_error: errorMessage
          }).where({ id });

          return reject(new Error(errorMessage));
        }

        const proposal = {
          created: now.toISOString(),
          creator: this.id,
          body: await response.text()
        };

        const mimeType = response.headers.get('Content-Type')?.split(';')[0] || 'text/plain';
        const blob = new Actor({ content: proposal.body });
        const existingBlob = await this.db('blobs').where({ fabric_id: blob.id }).first();

        // Only proceed if this is new content (new blob)
        if (!existingBlob) {
          // Insert new blob for this unique content
          const inserted = await this.db('blobs').insert({
            content: proposal.body,
            fabric_id: blob.id,
            mime_type: mimeType
          });

          let embedding = null;

          try {
            embedding = await this.trainer.ingestDocument({
              content: proposal.body,
              metadata: { id: blob.id, origin: link }
            }, 'hypertext');
          } catch (exception) {
            const errorMessage = `Error ingesting document: ${exception.message}`;
            console.error('[SENSEMAKER:CORE]', '[SYNC]', errorMessage, exception);

            // Update source with error
            await this.db('sources').update({
              updated_at: toMySQLDatetime(now),
              last_error: errorMessage
            }).where({ id });

            return reject(exception);
          }

          // Determine fabric_type based on MIME type
          let fabricType = 'Text'; // default
          if (mimeType === 'text/html') {
            fabricType = 'HTML';
          } else if (mimeType === 'text/markdown') {
            fabricType = 'Markdown';
          }

          // Create document actor for proper fabric_id
          const documentActor = new Actor({
            type: fabricType,
            title: `Snapshot of ${source.name || source.content}`,
            content: proposal.body,
            created: now.toISOString()
          });

          // Create new document for this unique content
          // blob.id (fabric_id) is the absolute reference for the content (deterministic from Actor)
          // Documents created from sources have creator: null, owner: null
          // latest_blob_id stores the blob's fabric_id for exact reference
          await this.db('documents').insert({
            creator: null, // System-generated from source
            owner: null,   // System-generated from source
            fabric_id: documentActor.id,
            title: `Snapshot of ${source.name || source.content}`,
            summary: `Automatically captured snapshot from source: ${link}`,
            content: proposal.body,
            status: 'published',
            latest_blob_id: blob.id, // Absolute blob reference (fabric_id from Actor)
            history: JSON.stringify([blob.id]),
            mime_type: mimeType,
            fabric_type: fabricType,
            created_at: toMySQLDatetime(now),
            updated_at: toMySQLDatetime(now)
          });

          if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SYNC]', `Created new ${fabricType} document for unique content from source:`, documentActor.id);
        } else {
          if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SYNC]', 'Content unchanged, no new document created. Blob ID:', blob.id);
        }

        // Track blob fabric_id in source's history for exact reference
        // Get existing blob history or initialize empty array
        const sourceUpdate = {
          updated_at: toMySQLDatetime(now),
          last_retrieved: toMySQLDatetime(now),
          latest_blob_id: blob.id, // Absolute reference: blob's fabric_id
          last_error: null // Clear any previous errors on successful sync
        };

        // Maintain history of blob fabric_ids from this source
        // This allows querying all documents that reference blobs from this source
        const existingSource = await this.db('sources').where({ id }).select('blob_history').first();
        let blobHistory = [];
        if (existingSource && existingSource.blob_history) {
          try {
            blobHistory = JSON.parse(existingSource.blob_history);
          } catch (e) {
            blobHistory = [];
          }
        }

        // Add current blob fabric_id to history if not already present
        if (!blobHistory.includes(blob.id)) {
          blobHistory.push(blob.id);
          sourceUpdate.blob_history = JSON.stringify(blobHistory);
        }

        await this.db('sources').update(sourceUpdate).where({ id });

        const actor = new Actor(proposal);
        resolve({
          created: now,
          content: proposal,
          id: actor.id,
          type: 'SourceSnapshot'
        });
      } catch (exception) {
        // Catch any unexpected errors and update the database
        const errorMessage = exception.message || String(exception);
        console.error('[SENSEMAKER:CORE]', '[SYNC]', 'Unexpected error:', errorMessage, exception);

        try {
          await this.db('sources').update({
            updated_at: toMySQLDatetime(new Date()),
            last_error: errorMessage
          }).where({ id });
        } catch (dbError) {
          console.error('[SENSEMAKER:CORE]', '[SYNC]', 'Failed to update error in database:', dbError);
        }

        reject(exception);
      }
    });
  }

  async _attachWorkers () {
    for (let i = 0; i < this.settings.workers; i++) {
      const worker = new Worker();
      this.workers.push(worker);
    }
  }

  async _createBlob (content) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DOCUMENTS]', 'Creating blob from content:', content);
    const preimage = crypto.createHash('sha256').update(content).digest('hex');
    const hash = crypto.createHash('sha256').update(preimage).digest('hex');
    const existingBlob = await this.db('blobs').where({ preimage_sha256: hash }).first();

    if (existingBlob) {
      return {
        id: existingBlob.fabric_id
      };
    }

    const actor = new Actor({ content });
    const blob = {
      content,
      mime_type: 'text/plain',
      fabric_id: actor.id
    };

    // Insert the blob into the database
    const inserted = await this.db('blobs').insert(blob);

    return {
      id: inserted[0],
      fabric_id: actor.id,
      content: blob.content
    };
  }

  async _createDocumentFromFile (path) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DOCUMENTS]', 'Creating document from file:', path);
    const file = await this.fs.stat(path);
    if (!file) throw new Error('File not found.');

    // Create a new Document
    const actor = new Actor({ content: file.content });
    const blob = await this._createBlob(file.content);

    // Create a new Document
    const document = {
      blob_id: blob.id,
      created_at: toMySQLDatetime(file.created),
      title: file.name,
      latest_blob_id: blob.id
    };

    const docInserted = await this.db('documents').insert(document);

    return {
      id: docInserted[0],
      fabric_id: actor.id,
      title: file.name,
      created_at: toMySQLDatetime(file.created)
    };
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
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Generic search request:', request);

    this.search(request).then((results) => {
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Results:', results);

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

  async _handleRAGQuery (query) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[RAG]', 'Query:', query);
    const result = await this.fabric.search({
      query: query,
      model: 'sensemaker-0.2.0-RC1'
    });

    return result;
  }

  async _handleConversationSearchRequest (req, res, next) {
    const request = req.body;
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Conversation search request:', request);

    this.searchConversations(request).then((results) => {
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Results:', results);

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

  async _ensureDiscordUser (object) {
    // Create (or Restore) Identities
    let userID = null;
    let id = null;

    const identity = await this.db('identities').where({ source: 'discord', content: object.ref }).first();
    if (!identity) {
      const actor = new Actor({ name: `discord/users/${object.ref}` });
      const ids = await this.db('identities').insert({
        fabric_id: actor.id,
        source: 'discord',
        content: object.ref
      });

      const duser = await this.db('identities').insert({
        fabric_id: actor.id,
        source: 'discord',
        content: object.username
      });

      id = ids[0];
    } else {
      id = identity.id;
    }

    const retrieved = await this.db('users').where({ discord_id: object.ref }).first();
    if (!retrieved) {
      const newUser = await this.db('users').insert({
        discord_id: object.ref,
        fabric_id: object.id,
        username: object.username
      });

      userID = newUser[0];
    } else {
      userID = retrieved.id;
    }

    return {
      id: userID
    };
  }

  async _ensureDiscordChannel (target) {
    let conversationID = null;
    let log = null;

    // Create (or Restore) Conversation
    const resumed = await this.db('conversations').where({ fabric_id: target.id }).first();
    if (!resumed) {
      const newConversation = await this.db('conversations').insert({
        creator_id: userID,
        discord_id: target.ref,
        fabric_id: target.id,
        title: target.username,
        log: JSON.stringify([])
      });

      conversationID = newConversation[0];
      log = [];
    } else {
      conversationID = resumed.id;
      log = resumed.log;
    }

    return {
      id: conversationID
    };
  }

  async _handleBitcoinStatusRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        if (!this.bitcoin && !this.regtest) {
          return res.status(503).json({
            error: 'Bitcoin service is not available',
            status: 'error',
            message: 'The Bitcoin service has not been initialized'
          });
        }

        try {
          // Create a cache key for this update
          const cacheKey = 'bitcoin:status';
          const cacheTTL = 60000; // 1 minute cache

          // Check cache first
          const cached = await this.cache.get(cacheKey);
          if (cached) {
            // Return cached data immediately
            res.json(cached);

            // Check if cache is stale (older than 30 seconds)
            const now = Date.now();
            if (now - cached.timestamp > 30000) {
              // Trigger background update
              this._updateBitcoinStatus(cacheKey, cacheTTL).catch(err => {
                console.error('[SENSEMAKER]', 'Background Bitcoin status update failed:', err);
              });
            }
            return;
          }

          // If no cache, update synchronously
          const status = await this._updateBitcoinStatus(cacheKey, cacheTTL);
          res.json(status);
        } catch (error) {
          console.error('[SENSEMAKER]', 'Error handling Bitcoin status request:', error);
          res.status(500).json({
            error: 'Internal server error',
            status: 'error',
            message: 'Failed to handle Bitcoin status request'
          });
        }
      }
    });
  }

  async _handleDiscordActivity (activity) {
    if (this.settings.debug) this.emit('debug', ['[SENSEMAKER:CORE]', '[DISCORD]', 'Discord activity:', activity].join(' '));
    if (activity.actor == this.discord.id) return;

    if (activity.type === 'DiscordMessage') {
      if (this.settings.debug) console.debug('got discord message:', activity.object);
    }

    const identity = await this._ensureDiscordUser(activity.actor);
    if (this.settings.debug) console.debug('ensured identity:', identity);

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
          discord_id: activity.target.ref,
          fabric_id: activity.target.id,
          title: activity.target.name,
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
        conversation_id: activity.target.id,
        query: activity.object.content,
        platform: 'discord',
        username: activity.actor.username
      }).then((response) => {
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Response:', response);
        this.discord._sendToChannel(activity.target.ref, response.content);
      });

      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Request:', request);
    }
  }

  async _handleDiscordAuthorizeRequest (req, res, next) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'auth request...', req.user, req.params, req.query);
    if (req.query.code) {
      let newFlow = false; // Flag for new user flow

      const code = req.query.code;
      const token = await this.discord.exchangeCodeForToken(code);

      if (!token.access_token) {
        // TODO: show error message in client
        // console.debug('Discord did not provide an access token for code:', code, token);
        return res.redirect('/settings');
      }

      this.discord.getTokenUser(token.access_token).then(async (response) => {
        let id = null;
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
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Message:', message);
  }

  async _handleDiscordLog (message) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Log Event:', message);
  }

  async _handleDiscordDebug (message) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Debug Event:', message);
  }

  async _handleDiscordReady (message) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Ready:', message);
  }

  async _handleDiscordStatusRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        if (!this.discord || !this.discord.client) {
          return res.status(503).json({
            enabled: false,
            guilds: [],
            error: 'Discord integration is disabled or not connected.'
          });
        }
        const guilds = this.discord.client.guilds.cache.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          description: g.description,
          memberCount: g.memberCount,
          approximateMemberCount: g.approximateMemberCount
        }));
        res.json({ enabled: true, guilds });
      }
    });
  }

  async _handleFabricStatusRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        const status = await this.fabric;
        res.send(status);
      }
    });
  }

  async _handleGitHubStatusRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        const status = await this.github;
        res.send(status);
      }
    });
  }

  _handleLiveRequest (req, res) {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  }

  async _handleHealthRequest (req, res, next) {
    try {
      const health = await this.checkHealth();
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
        content: exception && exception.message ? { message: exception.message } : String(exception)
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

  async _handleFabricActivity (activity) {
    if (this.settings.debug) console.debug('[FABRIC]', '[ACTIVITY]', activity);
  }

  async _handleFabricDebug (...props) {
    if (this.settings.debug) {
      console.debug('[FABRIC]', '[DEBUG]', ...props);
    }
  }

  async _handleFabricError (...props) {
    console.error('[FABRIC]', '[ERROR]', ...props);
  }

  async _handleFabricDocument (document) {
    if (this.settings.debug) console.debug('[FABRIC]', '[DOCUMENT]', '[INSERT]', document);
    const inserted = await this.db('documents').insert({
      fabric_id: document.id,
      description: document.description,
      created_at: document.created_at
    });
    if (this.settings.debug) console.debug('[FABRIC]', '[DOCUMENT]', '[INSERT]', `${inserted.length} documents inserted:`, inserted);
  }

  async _handleFabricMessage (activity) {
    if (this.settings.debug) console.debug('[FABRIC]', '[ACTIVITY]', activity);
  }

  async _handleFabricPerson (person) {
    if (this.settings.debug) console.debug('[FABRIC]', '[PERSON]', person);
    const target = await this.db('people').where({ fabric_id: person.id }).first();
    if (this.settings.debug) console.debug('[FABRIC]', '[PERSON]', '[TARGET]', target);
    if (!target) {
      const inserted = await this.db('people').insert({
        fabric_id: person.id,
        full_name: person.full_name,
        name_first: person.name_first,
        name_middle: person.name_middle,
        name_last: person.name_last,
        name_suffix: person.name_suffix,
        date_of_birth: person.date_of_birth,
        date_of_death: person.date_of_death
      });

      if (this.settings.debug) console.debug('[FABRIC]', '[PERSON]', '[INSERTED]', inserted);
    }
  }

  async _handleLocalDocument (document) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[DOCUMENT]', '[SELF]', document);
  }

  async _handleOpenAIError (error) {
    this.emit('error', `[SERVICES:OPENAI] ${error}`);
  }

  async _handleOpenAIMessageStart (start) {
    start.type = 'MessageStart';
    chatStreamBridge.fabricStreamStart(this, start);
  }

  async _handleOpenAIMessageChunk (chunk) {
    chunk.type = 'MessageChunk';
    chatStreamBridge.fabricStreamChunk(this, chunk);
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
    return [];
  }

  async _getConversationMessages (conversationID) {
    const messages = await this.db('messages').where({ conversation_id: conversationID, status: 'ready' }).innerJoin('users', 'messages.user_id', 'users.id').select('messages.*', 'users.username');
    return messages;
  }

  /**
   * Generate a response to a request.
   * @param {SensemakerRequest} request The request.
   * @param {String} [request.room] Matrix room to retrieve conversation history from.
   * @returns {SensemakerResponse}
   */
  async _handleRequest (request) {
    if (this.settings.debug) this.emit('debug', `[SENSEMAKER:CORE] Handling request: ${JSON.stringify(request)}`);

    let messages = [];

    if (request.room) {
      // Matrix request
      if (this.settings.debug) console.debug('request has room:', request.room);
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

  async _summarizeMessages (messages, max = 256) {
    return new Promise((resolve, reject) => {
      const query = `Summarize our conversation into a ${max}-character maximum as a paragraph.  Do not consider the initial prompt, focus on the user's messages as opposed to machine responses.`;
      const request = { query: query, messages: messages };
      this.sensemaker.query(request).catch(reject).then(resolve);
    });
  }

  async _summarizeMessagesToTitle (messages, max = 64) {
    return new Promise((resolve, reject) => {
      const query = `Summarize our conversation into a ${max}-character maximum as a title.  Do not use quotation marks to surround the title, and be as specific as possible with regards to subject material so that the user can easily identify the title from a large list conversations.  Do not consider the initial prompt, focus on the user's messages as opposed to machine responses.`;
      const request = { query: query, messages: messages };
      this.sensemaker.query(request).catch(reject).then(resolve);
    });
  }

  async _generateEmbedding (text = '', model = 'text-embedding-ada-002') {
    const maxChars = parseInt(process.env.SENSEMAKER_EMBED_MAX_CHARS || '6000', 10);
    const safe = text && text.length > maxChars ? text.slice(0, maxChars) : text;
    const embeddings = await this.openai.generateEmbedding(safe, model);
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
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Searching documents:', request);
      if (!request) throw new Error('No request provided.');
      if (!request.query) throw new Error('No query provided.');

      // Specify filter
      request.filter = { '@type': 'document' };

      // Use vector search with configurable limit
      const searchLimit = request.limit || 1;
      this.trainer.search(request, searchLimit).then(async (results) => {
        let response = [];
        if (this.settings.debug) console.debug('search results:', results.content);
        for (let i = 0; i < results.content.length; i++) {
          const result = results.content[i];
          switch (result.metadata?.type) {
            case 'document':
              const document = await this.db('documents')
                .select('*')
                .where({ id: result.metadata.id })
                .andWhere('status', '!=', 'deleted')
                .first();
              if (document) {
                // Ensure title fallback for consistency
                if (!document.title) {
                  document.title = document.filename || document.name || 'Untitled Document';
                }
                response.push(document);
              }
              break;
            case 'file':
              const file = await this.db('files').where({ id: result.metadata.id }).first();
              if (this.settings.debug) console.debug('[SEARCH]', '[DOCUMENTS]', 'File:', file);
              response.push(file);
              break;
            default:
              if (this.settings.debug) console.debug('[SEARCH]', '[DOCUMENTS]', 'Unknown result type:', result?.metadata?.type);
              response.push({ content: result.content, metadata: { type: 'unknown', id: null }, object: result });
              break;
          }
        }

        resolve(response);
      }).catch((error) => {
        console.warn('[SENSEMAKER:CORE]', '[SEARCH]', 'Vector document search failed (continuing without Redis hits):', error.message || error);
        resolve([]);
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
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[SEARCH]', 'Searching people:', request);
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
    if (this.settings.debug) console.debug('got answer:', result);

    return result;
  }

  async _registerTool (name, tool) {
    if (!name) throw new Error('No tool name provided.');
    if (!tool) throw new Error('No tool provided.');

    if (this.tools[name]) {
      return this.emit('warning', `Tool already registered: ${name}`);
    }

    this.tools[name] = tool;
    this.emit('log', `Registered tool: ${name}`);

    return this;
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

    // Register UI components if service provides them
    if (typeof service.getUIConfig === 'function') {
      try {
        const uiConfig = service.getUIConfig();
        if (uiConfig) {
          this.uiRegistry.register(name, uiConfig);
          this.emit('log', `[SERVICE-UI] Registered UI components for service "${name}"`);
        }
      } catch (error) {
        this.emit('warning', `[SERVICE-UI] Error registering UI for service "${name}": ${error.message}`);
      }
    }

    await this.commit();

    return this;
  }

  async _syncEmbeddings (limit = 100) {
    if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[VECTOR]', `Syncing ${limit} embeddings...`);
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
        this.db('documents').select(['id', 'description', 'content', 'fabric_id', 'owner']).whereNotNull('content').orderByRaw('RAND()').limit(limit).then(async (documents) => {
          for (let i = 0; i < documents.length; i++) {
            const element = documents[i];
            const actor = { name: `sensemaker/documents/${element.id}` };
            // TODO: consider additional metadata fields
            const document = { name: `sensemaker/documents/${element.id}`, content: element };
            const embedding = await this.trainer.ingestDocument({
              content: JSON.stringify(document),
              metadata: {
                ...document,
                source_document_id: element.id,
                fabric_id: element.fabric_id,
                owner: element.owner,
                type: 'document'
              }
            }, 'document');
            if (this.settings.verbosity > 4) if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[VECTOR]', '[DOCUMENTS]', 'Ingested:', embedding);
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
    req.user = {
      id: null,
      roles: [],
      caps: [],
      state: {},
      sessionTrust: 'none',
      is_admin: false
    };

    let cookieToken = null;
    if (req.headers.cookie) {
      req.cookies = req.headers.cookie
        .split(';')
        .map((x) => x.trim().split(/=(.+)/))
        .reduce((acc, curr) => {
          acc[curr[0]] = curr[1];
          return acc;
        }, {});

      cookieToken = req.cookies.token;
    }

    const authzHeader = (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
      ? req.headers.authorization
      : (cookieToken ? `Bearer ${cookieToken}` : null);

    if (authzHeader && this.key) {
      const merged = nodeSessionToken.mergeVerifiedBearerTokens(authzHeader, this.key);
      if (merged && merged.id != null) {
        req.user.id = merged.id;
        req.user.roles = merged.roles;
        req.user.caps = merged.caps;
        req.user.sessionTrust = merged.sessionTrust;
        req.user.state = { roles: merged.roles };
        req.user.is_admin = nodeSessionToken.capsIncludeAdmin(merged.caps);
        if (this.settings.audit) {
          this.emit('debug', `[AUTH] node-signed session user=${req.user.id} caps=${merged.caps.join(',')}`);
        }
        return next();
      }
    }

    const legacyWire = (req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
      ? req.headers.authorization.slice(7).trim()
      : cookieToken;

    const allowLegacy = process.env.SENSEMAKER_LEGACY_SESSION_TOKENS === '1'
      || process.env.SENSEMAKER_LEGACY_SESSION_TOKENS === 'true';
    if (allowLegacy && legacyWire) {
      const dotCount = (legacyWire.match(/\./g) || []).length;
      if (dotCount === 2) {
        const secret = this.settings.tokenSecret || this.settings.seed;
        const verification = fabricAuth.verifyBearerToken(legacyWire, secret);
        if (verification.valid && verification.payload) {
          const p = verification.payload;
          const sid = p.sub != null ? parseInt(String(p.sub), 10) : NaN;
          if (Number.isFinite(sid)) {
            req.user.id = sid;
            req.user.sessionTrust = 'legacy-hmac';
            req.user.state = p.state && typeof p.state === 'object' ? p.state : {};
            req.user.roles = Array.isArray(req.user.state.roles) ? req.user.state.roles.slice() : [];
            req.user.caps = [nodeSessionToken.CAP_IDENTITY];
            req.user.is_admin = false;
            if (this.settings.audit) {
              this.emit('debug', `[AUTH] legacy HMAC session user=${req.user.id} (admin capability withheld — re-login for node-signed token)`);
            }
          }
        }
      }
    }

    next();
  }

  /**
   * Node-signed session with {@link nodeSessionToken.CAP_ADMIN} and DB `is_admin`.
   * Legacy HMAC sessions never satisfy this (forged bearer tokens could otherwise claim admin).
   */
  async _userHasAdminAccess (req) {
    if (!req.user || req.user.id == null) return false;
    if (req.user.sessionTrust !== 'node-signed') return false;
    if (!nodeSessionToken.capsIncludeAdmin(req.user.caps)) return false;
    try {
      const row = await this.db('users').where({ id: req.user.id }).select('is_admin').first();
      return !!(row && (row.is_admin === true || row.is_admin === 1));
    } catch (err) {
      console.error('[SENSEMAKER]', 'Admin capability check failed:', err.message);
      return false;
    }
  }

  /**
   * Single JSON body for failed admin checks (DRY for routes).
   */
  _sendSensemakerAdminRequiredJson (req, res) {
    if (!req.user || req.user.id == null) {
      res.status(401).json({ error: 'Authentication required' });
    } else {
      res.status(403).json({
        error: 'Administrator privileges required',
        detail: 'Use a session token issued and signed by this node (includes CAP_ADMIN). Re-login after deploy or key rotation. Legacy HMAC session tokens cannot grant admin.'
      });
    }
  }

  /**
   * Require node-signed CAP_ADMIN + DB admin for JSON API handlers.
   * @returns {Promise<boolean>} false if response was sent with an error status
   */
  async _assertSensemakerAdminJson (req, res) {
    if (await this._userHasAdminAccess(req)) return true;
    this._sendSensemakerAdminRequiredJson(req, res);
    return false;
  }

  /**
   * Conversation row must include `creator_id`. Admins may access any; others only their own.
   */
  async _userCanAccessConversation (req, conversation) {
    if (!conversation || req.user == null || req.user.id == null) return false;
    if (Number(conversation.creator_id) === Number(req.user.id)) return true;
    return this._userHasAdminAccess(req);
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

  async _updateBitcoinStatus (cacheKey, cacheTTL) {
    if (this.settings.debug) console.debug('[SENSEMAKER]', 'Updating Bitcoin status...');
    const bitcoin = this.bitcoin || this.regtest;
    // Make RPC calls with original names
    const blockchain = await bitcoin._makeRPCRequest('getblockchaininfo', []);
    const best = await bitcoin._makeRPCRequest('getbestblockhash', []);
    const height = await bitcoin._makeRPCRequest('getblockcount', []);

    // Initialize mempool info with default values
    let mempoolinfo = {
      size: 0,
      bytes: 0,
      usage: 0,
      maxmempool: 300000000, // 300MB default
      mempoolminfee: 0.00001000, // 1 sat/byte default
      minrelaytxfee: 0.00001000 // 1 sat/byte default
    };

    try {
      const result = await bitcoin._makeRPCRequest('getmempoolinfo', [true]);
      if (result) {
        mempoolinfo = {
          ...mempoolinfo, // Keep defaults as fallback
          ...result // Override with actual values if available
        };
      }
    } catch (err) {
      console.error('[SENSEMAKER]', 'Error getting mempool info:', err);
    }

    const tip = await bitcoin._makeRPCRequest('getblockheader', [best]);
    if (this.settings.debug) console.debug('got tip:', tip);

    // Initialize market with default values
    let market = {
      subsidy: 0,
      totalfee: 0,
      height: height,
      time: Date.now() / 1000
    };

    try {
      const result = await bitcoin._makeRPCRequest('getblockstats', [tip.height]);
      if (result) {
        market = {
          ...market, // Keep defaults as fallback
          ...result // Override with actual values if available
        };
      }
    } catch (err) {
      console.error('[SENSEMAKER]', 'Error getting block stats:', err);
    }

    if (this.settings.debug) console.debug('got block stats:', market);

    // Get block stats with error handling
    const blockstatsPromises = [
      height,
      height - 1,
      height - 2,
      height - 3,
      height - 4,
      height - 5
    ].map(h => bitcoin._makeRPCRequest('getblockstats', [h])
      .catch(err => {
        console.error('[SENSEMAKER]', `Error getting block stats for height ${h}:`, err);
        return null;
      }));

    const blockstats = await Promise.all(blockstatsPromises);
    if (this.settings.debug) console.debug('got all blockstats:', blockstats);

    // Filter out any failed block stats and ensure they have required properties
    const validBlockstats = blockstats.filter(x => x != null && x.blockhash && x.subsidy != null && x.totalfee != null);

    // Get blocks with error handling
    const blocks = await Promise.all(validBlockstats.map(async (x) => {
      try {
        const block = await bitcoin._makeRPCRequest('getblock', [x.blockhash, 2]);
        if (block) {
          block.subsidy = (x.subsidy || 0) / 100000000;
          block.feesPaid = (x.totalfee || 0) / 100000000;
          return block;
        }
        return null;
      } catch (err) {
        console.error('[SENSEMAKER]', `Error getting block ${x.blockhash}:`, err);
        return null;
      }
    }));

    // Filter out any failed blocks
    const validBlocks = blocks.filter(x => x != null);
    const transactions = [];

    // Get cached mempool data if available
    const cachedMempool = await this.cache.get('bitcoin:mempool');
    const mempooltxs = cachedMempool || {};

    // Process mempool transactions
    for (const [txid, tx] of Object.entries(mempooltxs)) {
      const mempoolTx = {
        txid: txid,
        time: tx.time,
        fee: tx.fee,
        size: tx.size,
        height: -1, // -1 indicates unconfirmed
        blockhash: null,
        value: tx.vout ? tx.vout.reduce((acc, x) => acc + x.value, 0) : 0
      };
      transactions.push(mempoolTx);
    }

    // Loop through all blocks until we have 5 transactions
    for (let i = 0; i < validBlocks.length; i++) {
      const block = validBlocks[i];
      // Calculate the total value of the block
      block.value = (block.tx) ? block.tx.reduce((acc, x) => acc + x.vout.reduce((acc, x) => acc + x.value, 0), 0) : 0;
      if (!block.tx) continue;

      // For all transactions in the block...
      for (let j = 0; j < block.tx.length; j++) {
        const tx = block.tx[j];

        // Assign properties
        tx.blockhash = block.hash;
        tx.height = block.height;
        tx.time = block.time;
        tx.value = tx.vout.reduce((acc, x) => acc + x.value, 0);

        // Add the transaction to the list
        transactions.push(tx);

        // Is this enough?
        if (transactions.length >= 5) break;
      }

      // Remove transaction data after we're done with it
      delete validBlocks[i].tx;

      // Do we have enough transactions?
      if (transactions.length >= 5) break;
    }

    // Sort transactions by time in descending order (most recent first)
    transactions.sort((a, b) => b.time - a.time);

    // Get cached UTXO set info if available
    const cachedUtxoSet = await this.cache.get('bitcoin:utxoset');
    const utxoutset = cachedUtxoSet || {
      total_amount: 0,
      transactions: 0,
      txouts: 0
    };

    const status = {
      network: bitcoin.network,
      // genesisHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
      chain: blockchain,
      // blockDate: tip.time,
      supply: utxoutset.total_amount,
      status: 'ONLINE', // TODO: check for syncing status
      tip: best,
      height: height,
      mempool: {
        size: mempoolinfo.size,
        bytes: mempoolinfo.bytes,
        usage: mempoolinfo.usage
      },
      unspentTransactions: utxoutset.transactions,
      unspentOutputs: utxoutset.txouts,
      market: {
        subsidy: market.subsidy / 100000000,
        feesPaid: market.totalfee / 100000000,
        height: market.height,
        time: market.time
      },
      recentBlocks: validBlocks.map(block => ({
        hash: block.hash,
        height: block.height,
        time: block.time,
        size: block.size,
        weight: block.weight,
        subsidy: block.subsidy,
        feesPaid: block.feesPaid,
        value: block.value
      })),
      recentTransactions: transactions.map(tx => ({
        txid: tx.txid,
        time: tx.time,
        fee: tx.fee,
        size: tx.size,
        height: tx.height,
        value: tx.value
      })),
      syncActive: blockchain.initialblockdownload,
      syncProgress: blockchain.verificationprogress,
      timestamp: Date.now() // Add timestamp for cache freshness check
    };

    // Store in state
    this._state.content.services.bitcoin.status = status;

    // Cache the status
    await this.cache.set(cacheKey, status, cacheTTL);

    // Update UTXO set info in the background
    bitcoin._makeRPCRequest('gettxoutsetinfo', []).then(async (utxoSet) => {
      // Cache the UTXO set info for 1 hour
      await this.cache.set('bitcoin:utxoset', utxoSet, 3600000);
      // Update the cache with fresh data
      await this.cache.set(cacheKey, status, cacheTTL);

      // Update the state with fresh UTXO data
      if (this._state.content.services.bitcoin.status) {
        this._state.content.services.bitcoin.status.supply = utxoSet.total_amount;
        this._state.content.services.bitcoin.status.unspentTransactions = utxoSet.transactions;
        this._state.content.services.bitcoin.status.unspentOutputs = utxoSet.txouts;
      }
    }).catch(err => {
      console.error('[SENSEMAKER]', 'Failed to update UTXO set info:', err);
    });

    // Update mempool data in the background
    bitcoin._makeRPCRequest('getrawmempool', [true]).then(async (mempoolData) => {
      // Cache the mempool data for 30 seconds
      await this.cache.set('bitcoin:mempool', mempoolData, 30000);
      this._state.content.services.bitcoin.mempool = mempoolData;
    }).catch(err => {
      console.error('[SENSEMAKER]', 'Failed to update mempool data:', err);
    });

    return status;
  }

  /**
   * Verifies a signed message
   * @param {Object} signedMessage - The signed message object
   * @returns {Boolean} - Whether the signature is valid
   */
  verifyMessage (signedMessage) {
    if (!this.settings.signingKey) {
      console.warn('[SENSEMAKER]', 'No signing key configured, skipping verification');
      return true;
    }

    try {
      const { message, signature, timestamp } = signedMessage;
      const hmac = crypto.createHmac('sha256', this.settings.signingKey);
      hmac.update(message);
      hmac.update(timestamp.toString());
      const expectedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('[SENSEMAKER]', 'Error verifying message:', error);
      return false;
    }
  }

  async _handleWebSocketMessage (message) {
    try {
      // Parse the signed message
      const signedMessage = JSON.parse(message);

      // Verify the signature
      if (!this.verifyMessage(signedMessage)) {
        console.warn('[SENSEMAKER]', 'Invalid message signature');
        return;
      }

      // Process the original message
      const originalMessage = Message.fromBuffer(signedMessage.message);
      switch (originalMessage.type) {
        case 'SUBSCRIBE':
          // Handle subscription
          break;
        case 'UNSUBSCRIBE':
          // Handle unsubscription
          break;
        case 'Ping':
          // Handle ping
          break;
      }
    } catch (error) {
      console.error('[SENSEMAKER]', 'Error handling WebSocket message:', error);
    }
  }

  async _waitForBitcoind (maxAttempts = 5, initialDelay = 1000) {
    const chain = this.bitcoin || this.regtest;
    if (!chain) return true;

    if (this.settings.debug) console.debug('[FABRIC:BITCOIN]', 'Waiting for bitcoind to be ready...');
    let attempts = 0;
    let delay = initialDelay;

    while (attempts < maxAttempts) {
      try {
        if (this.settings.debug) console.debug('[FABRIC:BITCOIN]', `Attempt ${attempts + 1}/${maxAttempts} to connect to bitcoind...`);

        // Check multiple RPC endpoints to ensure full readiness
        const checks = [
          chain._makeRPCRequest('getblockchaininfo'), // Basic blockchain info
          chain._makeRPCRequest('getnetworkinfo'),    // Network status
          chain._makeRPCRequest('getwalletinfo')      // Wallet status
        ];

        // Wait for all checks to complete
        const results = await Promise.all(checks);

        if (this.settings.debug && this.settings.verbosity > 4) {
          console.debug('[FABRIC:BITCOIN]', 'Successfully connected to bitcoind:');
          console.debug('[FABRIC:BITCOIN]', '- Blockchain info:', results[0]);
          console.debug('[FABRIC:BITCOIN]', '- Network info:', results[1]);
          console.debug('[FABRIC:BITCOIN]', '- Wallet info:', results[2]);
        }

        return true;
      } catch (error) {
        if (this.settings.debug) console.debug('[FABRIC:BITCOIN]', `Connection attempt ${attempts + 1} failed:`, error.message);
        attempts++;

        // If we've exceeded max attempts, throw error
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to connect to bitcoind after ${maxAttempts} attempts: ${error.message}`);
        }

        // Wait before next attempt with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 10000); // Exponential backoff with max 10s delay
        continue; // Continue to next attempt
      }
    }

    // Should never reach here due to maxAttempts check in catch block
    throw new Error('Failed to connect to bitcoind: Max attempts exceeded');
  }
}

module.exports = Sensemaker;
