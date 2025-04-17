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
  BCRYPT_PASSWORD_ROUNDS,
  SNAPSHOT_INTERVAL,
  AGENT_MAX_TOKENS,
  MAX_RESPONSE_TIME_MS,
  PER_PAGE_LIMIT,
  PER_PAGE_DEFAULT,
  USER_QUERY_TIMEOUT_MS,
  SYNC_EMBEDDINGS_COUNT,
  ENABLE_SOURCES
} = require('../constants');

// Dependencies
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');

// External Dependencies
const { createClient } = require('redis');
const fetch = require('cross-fetch');
// const debounce = require('lodash.debounce');
const merge = require('lodash.merge');
// TODO: use levelgraph instead of level?
// const levelgraph = require('levelgraph');
const knex = require('knex');
const multer = require('multer');
// TODO: use bcryptjs instead of bcrypt?
const { hashSync, compareSync, genSaltSync } = require('bcrypt'); // user authentication

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
const StarCitizen = require('@rsi/star-citizen');

// Services
const Fabric = require('./fabric');
const EmailService = require('./email');
// const Gemini = require('./gemini');
// const Mistral = require('./mistral');
// const OpenAI = require('./openai');
const Stripe = require('./stripe');

// Internal Types
const Agent = require('../types/agent');
const Graph = require('../types/graph');
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
      ollama: {},
      openai: {},
      remotes: {},
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
    this.graph = new Graph(this.settings);
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
    this.bitcoin = (this.settings.bitcoin && this.settings.bitcoin.enable) ? new Bitcoin(this.settings.bitcoin) : null;
    this.email = (this.settings.email && this.settings.email.enable) ? new EmailService(this.settings.email) : null;
    this.matrix = (this.settings.matrix && this.settings.matrix.enable) ? new Matrix(this.settings.matrix) : null;
    // this.github = (this.settings.github.enable) ? new GitHub(this.settings.github) : null;
    this.discord = (this.settings.discord && this.settings.discord.enable) ? new Discord(merge({}, this.settings.discord, { authority: this.settings.authority })) : null;

    // Other Services
    // this.openai = new OpenAI(this.settings.openai);
    this.stripe = new Stripe(this.settings.stripe);
    this.rsi = new StarCitizen(this.settings.rsi);

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
      prompt: this.settings.prompt,
      constraints: this.settings.constraints,
      tools: true
    });

    // Agent Collection
    this.alpha = new Agent({ name: 'ALPHA', host: null, prompt: this.settings.prompt, openai: this.settings.openai });
    this.gamma = new Agent({ name: 'GAMMA', model: this.settings.ollama.model, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt, openai: this.settings.openai });
    this.delta = new Agent({ name: 'DELTA', model: this.settings.ollama.model, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt, openai: this.settings.openai });

    // Custom Models
    // NOTE: these are tested with `llama3` but not other models
    this.searcher = new Agent({ name: 'SEARCHER', rules: this.settings.rules, model: this.settings.ollama.model, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: 'You are SearcherAI, designed to return only a search term most likely to return the most relevant results to the user\'s query, assuming your response is used elsewhere in collecting information from the Sensemaker database.  Refrain from using generic terms such as "case", "v.", "vs.", etc., and simplify the search wherever possible to focus on the primary topic.  Only ever return the search query as your response.  For example, when the inquiry is: "Find a case that defines the scope of First Amendment rights in online speech." you should respond with "First Amendment" (excluding the quote marks).  Your responses will be sent directly to the network, so make sure to only ever respond with the best candidate for a search term for finding documents most relevant to the user question.  Leverage abstractions to extract the essence of the user request, using step-by-step reasoning to predict the most relevant search term.', openai: this.settings.openai });
    this.summarizer = new Agent({ name: this.settings.name, listen: false, model: this.settings.ollama.model, host: this.settings.ollama.host, secure: this.settings.ollama.secure, port: this.settings.ollama.port, prompt: this.prompt });

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

  async generateBlock () {
    return new Promise(async (resolve, reject) => {
      // Sync Health First
      const health = await this.checkHealth();
      // Jobs
      // TODO: move to a different method... generateBlock should only snapshot existing state
      // Scan Remotes
      this.worker.addJob({ type: 'ScanRemotes', params: [] });

      if (this.settings.embeddings.enable) {
        /* this._syncEmbeddings(SYNC_EMBEDDINGS_COUNT).then((output) => {
          console.debug('[SENSEMAKER:CORE]', 'Embedding sync complete:', output);
        }); */
      }

      const commit = this.commit();
      const object = {
        commit: commit
      };

      const block = new Actor(object);
      resolve(block);
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

      // Prepare Metadata
      let conversation = null;
      let requestor = null;
      let query = null;
      let messages = [];
      let priorConversations = null;
      let prompt = null;

      // Conversation Resume
      if (request.conversation_id) {
        console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Resuming conversation:', request.conversation_id);
        conversation = await this.db('conversations').select('id', 'agent_id', 'title', 'summary', 'created_at').where({ fabric_id: request.conversation_id }).first();
        if (!conversation) return reject(new Error('Conversation not found.'));
        const prev = await this._getConversationMessages(conversation.id);
        messages = prev.map((x) => {
          return { role: (x.user_id == 1) ? 'assistant' : 'user', name: (x.user_id == 1) ? '': undefined, content: x.content }
        });
      }

      // Store user request
      const localMessageIDs = await this.db('messages').insert({ conversation_id: conversation?.id, user_id: 1, status: 'computing', content: `${this.settings.name} is researching your question...` });
      const responseID = localMessageIDs[0];
      const responseName = `sensemaker/messages/${responseID}`;
      const responseObject = new Actor({ name: responseName });
      const localMessage = new Actor({ type: 'LocalMessage', name: `sensemaker/messages/${responseID}`, created: now });

      if (request.user_id) {
        requestor = await this.db('users').select('username', 'created_at').where({ id: request.user_id }).first();
        request.username = requestor.username;
        const conversationStats = await this.db('conversations').count('id as total').groupBy('creator_id').where({ creator_id: request.user_id });
        const recentConversations = await this.db('conversations').select('fabric_id as id', 'title', 'summary', 'created_at').where({ creator_id: request.user_id }).orderBy('created_at', 'desc').limit(20);
        priorConversations = recentConversations;
        if (conversationStats.total > 20) {
          priorConversations.push(`<...${conversationStats.total - 20} more conversations>`);
        }
      }

      if (request.context) {
        const localContext = { ...request.context, created: created, owner: this.id };
        const contextCall = new Actor(localContext);

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

      // User Context
      if (requestor) {
        const userContext = { user: requestor, created: created, owner: this.id };
        const userCall = new Actor(userContext);

       /*  messages.unshift({
          role: 'tool',
          tool_call_id: userCall.id,
          name: 'get_user_context',
          content: `${JSON.stringify(userContext, null, '  ')}\n`
        });

        messages.unshift({
          role: 'assistant',
          tool_calls: [{
            id: userCall.id,
            type: 'function',
            function: {
              name: 'get_user_context',
              arguments: JSON.stringify({})
            }
          }]
        }); */
      }

      if (request.agent) {
        const agent = await this.db('agents').select('id', 'latest_prompt_blob_id').where({ id: request.agent }).first();
        if (!agent) {
          prompt = this.settings.prompt;
        } else {
          const blob = await this.db('blobs').select('content').where({ id: agent.latest_prompt_blob_id }).first();
          if (!prompt) prompt = this.settings.prompt;
          prompt = blob.content;
        }
      }

      // Prompt
      messages.unshift({
        role: 'system',
        content: prompt
      });

      const forethought = {
        context: request.context || {},
        requestor: requestor || {}
      };

      const template = { prompt: prompt, query: request.query, messages: messages, tools: request.tools };
      if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[PIPELINE]', 'Initial template:', template);

      if (request.agent) {
        return this.sensemaker.query(template).then(async (summary) => {
          this.db('messages').where({ id: responseID }).update({
            status: 'ready',
            content: summary.content,
            updated_at: this.db.fn.now()
          }).catch((error) => {
            console.error('could not update message:', error);
            reject(error);
          }).then(() => {
            resolve(merge({}, summary, {
              actor: { name: this.name },
              object: { id: responseObject.id }, // Fabric ID
              target: { id: `${this.authority}/messages/${responseID}` },
              message_id: responseID // TODO: deprecate in favor of `object`
            }));
          });
        });
      }

      // Pipeline
      Promise.allSettled([
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout'));
          }, request.timeout || USER_QUERY_TIMEOUT_MS);
        }),
        this.trainer.query(template),
        this.sensemaker.query(template)
      ]).catch((error) => {
        console.error('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Pipeline error:', error);
        reject(error);
      }).then(async (responses) => {
        if (!responses) return reject(new Error('No responses from network.'));
        if (this.settings.debug) console.debug('[SENSEMAKER:CORE]', '[REQUEST:TEXT]', 'Responses:', responses);
        // Final Summary (actual answer)
        // TODO: stream answer as it comes back from backend (to clients subscribed to the conversation)
        // TODO: finalize WebSocket implementation
        // Filter and process responses
        const settled = responses.filter((x) => x.status === 'fulfilled').map((x) => {
          return { name: `ACTOR:${x.value.name}`, role: 'assistant', content: x.value.content }
        });

        this.sensemaker.query({
          prompt: prompt,
          query: `---\nnetwork: ${JSON.stringify(settled)}\ntimestamp: ${created}\nforethought: ${JSON.stringify(forethought)}\n---\n${request.query}`,
          tools: request.tools
        }).then(async (summary) => {
          // Update database with completed response
          this.db('messages').where({ id: responseID }).update({
            status: 'ready',
            content: summary.content,
            updated_at: this.db.fn.now()
          }).catch((error) => {
            console.error('could not update message:', error);
            reject(error);
          }).then(() => {
            resolve(merge({}, summary, {
              actor: { name: this.name },
              object: { id: responseObject.id }, // Fabric ID
              target: { id: `${this.authority}/messages/${responseID}` },
              message_id: responseID // TODO: deprecate in favor of `object`
            }));
          });
        });
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

  async describeImage (image) {
    this.vision.query({
      query: 'Describe the image.',
      images: [image]
    })
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
    // const other = await this._getUnprocessedDocumentStats();
    // const chunk = await this._getUnprocessedDocuments(limit);

    console.debug('[SENSEMAKER:CORE]', '[ETL]', 'Stats:', other, stats);

    const start = new Date();
    for (let i = 0; i < chunk.length; i++) {
      const instance = chunk[i];
      console.debug('[SENSEMAKER:CORE]', '[ETL]', 'Processing case:', instance.title, `[${instance.id}]`);
      // const nativeEmbedding = await this._generateEmbedding(`[sensemaker/documents/${instance.id}] ${instance.title}`);
      const titleEmbedding = await this._generateEmbedding(instance.title);
      await this.db('documents').where('id', instance.id).update({ title_embedding_id: titleEmbedding.id });
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
      documents: {}
    };

    const candidates = await Promise.allSettled([
      (new Promise((resolve, reject) => {
        setTimeout(reject, USER_QUERY_TIMEOUT_MS, new Error('Timeout!'));
      })),
      this._searchDocuments(query)
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

  async setupAdmin () {
    return new Promise(async (resolve, reject) => {
      const user = os.userInfo();
      const existing = await this.db('users').where({ username: user.username }).first();
      if (!existing) {
        const password = crypto.randomBytes(32).toString('base64');
        const salt = genSaltSync(BCRYPT_PASSWORD_ROUNDS);
        const hashed = hashSync(password, salt);
        const ids = await this.db('users').insert({ username: user.username, password: hashed, salt: salt, is_admin: true });
        this.admin = { id: ids[0], username: user.username };
        console.warn('[SENSEMAKER]', '[ADMIN]', 'Username:', user.username);
        console.warn('[SENSEMAKER]', '[ADMIN]', 'Password:', password);
        console.warn('[SENSEMAKER]', '[ADMIN]', 'Warning!  The password above will not be displayed again.');
      } else {
        this.admin = { id: existing.id, username: existing.username };
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
        console.debug('[SENSEMAKER:CORE]', '[AGENT]', 'Created:', agent);
      }

      resolve(this);
    });
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
    this.termsOfUse = fs.readFileSync('./contracts/terms-of-use.md').toString('utf8');

    await this.setupAdmin();
    await this.setupAgents();

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
    this.queue._registerMethod('IngestDocument', async (...params) => {
      console.debug('[SENSEMAKER:CORE]', '[QUEUE]', 'Ingesting document...', params);
      const document = await this.db('documents').where('id', params[0]).first();
      const ingested = await this.trainer.ingestDocument({ content: JSON.stringify(document.content), metadata: { id: document.id }}, 'document');
      return { status: 'COMPLETED', ingested };
    });

    // User Upload Ingest
    this.queue._registerMethod('IngestFile', IngestFile.bind(this), this);

    // Graph
    await this.graph.start();
    await this.graph.addActor({ name: 'sensemaker' });
    await this.graph.addActor({ name: 'terms-of-use' });
    await this.graph.addActor({ name: 'agents' });

    // Trainer
    // this.sensemaker.attachDatabase(this.db);
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

    // TODO: investigate Redis jobs / task queue for completeness
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
          const members = await this.discord.listGuildMembers(guild.id);
        }

        for (let i = 0; i < this.discord.channels.length; i++) {
          const channel = this.discord.channels[i];
          const members = await this.discord.listChannelMembers(channel.id);
        }
      }
    });

    // Worker Events
    this.worker.on('debug', (...debug) => console.debug(...debug));
    this.worker.on('log', (...log) => console.log(...log));
    this.worker.on('warning', (...warning) => console.warn(...warning));
    this.worker.on('error', (...error) => console.error(...error));

    // Bitcoin Events
    if (this.bitcoin) {
      this.bitcoin.on('error', (...error) => console.error('[BITCOIN]', '[ERROR]', ...error));
      this.bitcoin.on('log', (...log) => console.log('[BITCOIN]', ...log));
      this.bitcoin.on('warning', (...warning) => console.warn('[BITCOIN]', '[WARNING]', ...warning));
    }

    // Email Events
    if (this.email) {
      this.email.on('debug', (...debug) => console.debug('[EMAIL]', ...debug));
      this.email.on('log', (...log) => console.log('[EMAIL]', ...log));
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

    // Matrix Events
    if (this.matrix) {
      this.matrix.on('activity', this._handleMatrixActivity.bind(this));
      this.matrix.on('replay', this._handleMatrixReplay.bind(this));
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
    if (this.fabric) await this.fabric.start();
    if (this.email) await this.email.start();
    if (this.matrix) await this.matrix.start();
    if (this.rsi) await this.rsi.start();
    // if (this.github) await this.github.start();
    if (this.discord) {
      try {
        await this.discord.start();
      } catch (exception) {
        console.error('[SENSEMAKER:CORE]', '[DISCORD]', 'Error starting Discord:', exception);
      }
    }

    // AI Services
    // await this.rag.start();
    // await this.openai.start();

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

    // API
    this.http._addRoute('POST', '/v1/chat/completions', ROUTES.messages.createCompletion.bind(this));

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

    // Activities
    this.http._addRoute('GET', '/activities', ROUTES.activities.list.bind(this));
    this.http._addRoute('GET', '/activities/:id', ROUTES.activities.view.bind(this));

    // Agents
    this.http._addRoute('POST', '/agents', ROUTES.agents.create.bind(this));
    this.http._addRoute('GET', '/agents', ROUTES.agents.list.bind(this));
    this.http._addRoute('GET', '/agents/:id', ROUTES.agents.view.bind(this));

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
    this.http._addRoute('GET', '/features', ROUTES.products.listFeatures.bind(this));
    this.http._addRoute('GET', '/products', ROUTES.products.list.bind(this));

    // Blobs
    this.http._addRoute('GET', '/blobs/:id', ROUTES.blobs.view.bind(this));

    // Documents
    this.http._addRoute('POST', '/documents', ROUTES.documents.create.bind(this));
    this.http._addRoute('GET', '/documents/:fabricID', ROUTES.documents.view.bind(this));
    this.http._addRoute('PATCH', '/documents/:fabricID', ROUTES.documents.edit.bind(this));
    this.http._addRoute('PATCH', '/documents/delete/:fabricID', ROUTES.documents.delete.bind(this));
    this.http._addRoute('GET', '/conversations/documents/:id', ROUTES.documents.newConversation.bind(this));

    this.http._addRoute('GET', '/groups', ROUTES.groups.list.bind(this));
    this.http._addRoute('GET', '/groups/:id', ROUTES.groups.view.bind(this));
    this.http._addRoute('POST', '/groups', ROUTES.groups.create.bind(this));
    this.http._addRoute('POST', '/groups/:id/members', ROUTES.groups.add_group_member.bind(this));

    // Wallet
    this.http._addRoute('POST', '/keys', ROUTES.keys.create.bind(this));
    this.http._addRoute('GET', '/keys', ROUTES.keys.list.bind(this));
    // this.http._addRoute('GET', '/keys/:id', ROUTES.keys.view.bind(this));

    // Peers
    this.http._addRoute('POST', '/peers', ROUTES.peers.create.bind(this));
    this.http._addRoute('GET', '/peers', ROUTES.peers.list.bind(this));
    this.http._addRoute('GET', '/peers/:id', ROUTES.peers.view.bind(this));

    // Sources
    this.http._addRoute('POST', '/sources', ROUTES.sources.create.bind(this));
    this.http._addRoute('GET', '/sources', ROUTES.sources.list.bind(this));
    this.http._addRoute('GET', '/sources/:id', ROUTES.sources.view.bind(this));

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
    this.http._addRoute('POST', '/services/feedback', this._handleFeedbackRequest.bind(this));
    this.http._addRoute('GET', '/services/bitcoin', this._handleBitcoinStatusRequest.bind(this));
    this.http._addRoute('GET', '/services/bitcoin/blocks', this._handleBitcoinBlockListRequest.bind(this));
    this.http._addRoute('GET', '/services/bitcoin/blocks/:blockhash', this._handleBitcoinBlockRequest.bind(this));
    this.http._addRoute('GET', '/services/bitcoin/transactions', this._handleBitcoinTransactionListRequest.bind(this));
    this.http._addRoute('GET', '/services/bitcoin/transactions/:txhash', this._handleBitcoinTransactionRequest.bind(this));
    this.http._addRoute('GET', '/services/discord', this._handleDiscordStatusRequest.bind(this));
    this.http._addRoute('GET', '/services/discord/guilds', ROUTES.services.discord.guilds.list.bind(this));
    this.http._addRoute('GET', '/services/discord/guilds/:guildid', ROUTES.services.discord.guilds.view.bind(this));
    this.http._addRoute('GET', '/services/discord/channels', ROUTES.services.discord.channels.list.bind(this));
    this.http._addRoute('GET', '/services/discord/channels/:id', ROUTES.services.discord.channels.view.bind(this));
    this.http._addRoute('GET', '/services/discord/users', ROUTES.services.discord.users.list.bind(this));
    this.http._addRoute('GET', '/services/discord/users/:id', ROUTES.services.discord.users.view.bind(this));
    this.http._addRoute('GET', '/services/discord/authorize', this._handleDiscordAuthorizeRequest.bind(this));
    this.http._addRoute('GET', '/services/discord/revoke', this._handleDiscordRevokeRequest.bind(this));
    this.http._addRoute('GET', '/services/fabric', this._handleFabricStatusRequest.bind(this));
    this.http._addRoute('GET', '/services/disk', ROUTES.services.disk.list.bind(this));
    this.http._addRoute('GET', '/services/disk/:path', ROUTES.services.disk.view.bind(this));
    this.http._addRoute('GET', '/services/github', this._handleGitHubStatusRequest.bind(this));
    this.http._addRoute('GET', '/services/matrix', this._handleMatrixStatusRequest.bind(this));
    this.http._addRoute('GET', '/services/star-citizen', this.rsi.handleGenericRequest.bind(this));
    this.http._addRoute('POST', '/services/star-citizen', this.rsi.handleGenericRequest.bind(this));
    this.http._addRoute('GET', '/services/star-citizen/activities', this.rsi.handleGenericRequest.bind(this));
    this.http._addRoute('POST', '/services/star-citizen/activities', ROUTES.services.rsi.activities.create.bind(this));

    // Feedback
    this.http._addRoute('POST', '/feedback', ROUTES.feedback.create.bind(this));

    // Help chat
    // TODO: rework help system into standardized pop-out chat
    this.http._addRoute('GET', '/conversations/help', ROUTES.help.getConversations.bind(this));
    this.http._addRoute('GET', '/conversations/help/admin', ROUTES.help.getAdmConversations.bind(this));
    this.http._addRoute('GET', '/messages/help/:conversation_id', ROUTES.help.getMessages.bind(this));
    this.http._addRoute('POST', '/messages/help/:conversation_id', ROUTES.help.sendMessage.bind(this));
    this.http._addRoute('PATCH', '/messages/help/:conversation_id', ROUTES.help.setMessagesRead.bind(this));

    this.http._addRoute('GET', '/redis/queue', ROUTES.redis.listQueue.bind(this));
    this.http._addRoute('PATCH', '/redis/queue', ROUTES.redis.clearQueue.bind(this));

    // Inquiries
    this.http._addRoute('POST', '/inquiries', ROUTES.inquiries.create.bind(this));
    this.http._addRoute('GET', '/inquiries', ROUTES.inquiries.list.bind(this));
    this.http._addRoute('DELETE', '/inquiries/:id', ROUTES.inquiries.delete.bind(this));

    // Invitations
    // TODO: review this
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
    this.http._addRoute('GET', '/sessions/current', ROUTES.sessions.current.bind(this));

    // TODO: fix these routes
    this.http._addRoute('POST', '/passwordChange', ROUTES.account.changePassword.bind(this));
    this.http._addRoute('POST', '/usernameChange', ROUTES.account.changeUsername.bind(this));
    this.http._addRoute('POST', '/passwordReset', ROUTES.account.resetPassword.bind(this));
    this.http._addRoute('POST', '/resettokencheck', ROUTES.account.checkResetToken.bind(this));
    this.http._addRoute('POST', '/passwordRestore', ROUTES.account.restorePassword.bind(this));

    // TODO: check logic of PATCH, any other routes conflict?
    // route to edit a conversation title
    this.http._addRoute('PATCH', '/conversations/:id', ROUTES.conversations.editConversationsTitle.bind(this));
    this.http._addRoute('GET', '/statistics', ROUTES.statistics.list.bind(this));
    this.http._addRoute('GET', '/conversations', ROUTES.conversations.list.bind(this));
    this.http._addRoute('GET', '/people', ROUTES.people.list.bind(this));
    this.http._addRoute('GET', '/people/:fabricID', ROUTES.people.view.bind(this));
    this.http._addRoute('GET', '/documents', ROUTES.documents.list.bind(this));
    this.http._addRoute('GET', '/messages', ROUTES.messages.getMessages.bind(this));
    this.http._addRoute('GET', '/conversations/:id', ROUTES.conversations.getConversationsByID.bind(this));
    this.http._addRoute('GET', '/contracts/terms-of-use', async (req, res, next) => {
      res.send({
        content: this.termsOfUse
      });
    });

    this.http._addRoute('GET', '/statistics/admin', ROUTES.statistics.admin.bind(this));
    this.http._addRoute('GET', '/statistics/accuracy', ROUTES.statistics.getAccuracy.bind(this));
    this.http._addRoute('GET', '/statistics/sync', ROUTES.statistics.sync.bind(this));
    this.http._addRoute('GET', '/settings', ROUTES.settings.list.bind(this));
    this.http._addRoute('GET', '/settings/admin', ROUTES.admin.overview.bind(this));
    this.http._addRoute('GET', '/settings/admin/overview', ROUTES.admin.overview.bind(this));
    this.http._addRoute('GET', '/settings/admin/settings', ROUTES.admin.settings.bind(this));
    this.http._addRoute('GET', '/settings/admin/users', ROUTES.admin.users.bind(this));
    this.http._addRoute('GET', '/settings/admin/growth', ROUTES.admin.growth.bind(this));
    this.http._addRoute('GET', '/settings/admin/conversations', ROUTES.admin.conversations.bind(this));
    this.http._addRoute('GET', '/settings/admin/services', ROUTES.admin.services.bind(this));
    this.http._addRoute('GET', '/settings/admin/design', ROUTES.admin.design.bind(this));
    this.http._addRoute('PATCH', '/settings/compliance', ROUTES.settings.updateCompliance.bind(this));
    this.http._addRoute('POST', '/reviews', ROUTES.reviews.create.bind(this));
    this.http._addRoute('POST', '/messages', ROUTES.messages.create.bind(this));

    // TODO: attach old message ID to a new message ID, send `regenerate_requested` to true
    this.http._addRoute('PATCH', '/messages/:id', ROUTES.messages.regenerate.bind(this));
    this.http._addRoute('POST', '/announcements', ROUTES.announcements.create.bind(this));
    this.http._addRoute('GET', '/announcements', ROUTES.announcements.list.bind(this));
    this.http._addRoute('GET', '/announcements/latest', ROUTES.announcements.latest.bind(this));

    // "The Changelog"
    // Stub for the news hub.
    this.http._addRoute('GET', '/updates', (req, res, next) => {
      res.send(this.applicationString);
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

    // Fabric Network
    if (this.settings.fabric && this.settings.fabric.enable) await this.agent.start();

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

  async syncSource (id) {
    return new Promise(async (resolve, reject) => {
      const source = await this.db('sources').where({ id }).first();
      if (!source) throw new Error('Source not found.');
      const link = source.content;
      fetch(link).catch((exception) => {
        reject(exception);
      }).then(async (response) => {
        if (!response) return reject(new Error('No response from source.'));
        const now = new Date();
        const proposal = {
          created: now.toISOString(),
          creator: this.id,
          body: await response.text()
        };

        const blob = new Actor({ content: proposal.body });
        const existing = await this.db('blobs').where({ fabric_id: blob.id }).first();
        if (!existing) {
          const inserted = await this.db('blobs').insert({
            content: proposal.body,
            fabric_id: blob.id,
            mime_type: response.headers.get('Content-Type').split(';')[0]
          });
        }

        let embedding = null;

        try {
          embedding = await this.trainer.ingestDocument({
            content: proposal.body,
            metadata: { id: blob.id, origin: link }
          }, 'hypertext');
        } catch (exception) {
          console.error('[SENSEMAKER:CORE]', '[SYNC]', 'Error ingesting document:', exception);
          reject(exception);
        }

        const doc = await this.db('documents').where({ blob_id: blob.id }).select('id').first();
        if (!doc) {
          await this.db('documents').insert({
            blob_id: blob.id,
            created_at: toMySQLDatetime(now),
            title: `Snaphot of ${source.content}`,
            latest_blob_id: blob.id
          });
        } else {
          await this.db('documents').update({
            updated_at: toMySQLDatetime(now),
            blob_id: blob.id
          }).where({ id: doc.id });
        }

        await this.db('sources').update({
          updated_at: toMySQLDatetime(now),
          last_retrieved: toMySQLDatetime(now),
          latest_blob_id: blob.id
        }).where({ id });

        const actor = new Actor(proposal);
        resolve({
          created: now,
          content: proposal,
          id: actor.id,
          type: 'SourceSnapshot'
        });
      });
    });
  }

  async _attachWorkers () {
    for (let i = 0; i < this.settings.workers; i++) {
      const worker = new Worker();
      this.workers.push(worker);
    }
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

  async _handleBitcoinBlockRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        if (!req.params.blockhash) return res.send({ status: 'error', message: 'Block hash is required.' });
        const block = await this.bitcoin._makeRPCRequest('getblock', [req.params.blockhash, 1]);
        const stats = await this.bitcoin._makeRPCRequest('getblockstats', [block.height]);
        block.subsidy = stats.subsidy / 100000000;
        block.feesPaid = stats.totalfee /  100000000;
        res.send(block);
      }
    })
  }

  async _handleBitcoinBlockListRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        // TODO: allow various parameters (sort order, cursor start, etc.)
        // TODO: cache each of these queries
        // TODO: cache this request overall
        const height = await this.bitcoin._makeRPCRequest('getblockcount', []);
        const promises = [];
        const count = 10;

        for (let i = 0; i < count; i++) {
          promises.push(this.bitcoin._makeRPCRequest('getblockstats', [height - i]));
        }

        const blockstats = await Promise.all(promises);
        const blocks = await Promise.all(blockstats.map(async (x) => {
          return new Promise((resolve, reject) => {
            this.bitcoin._makeRPCRequest('getblock', [x.blockhash, 1]).catch((error) => {
              reject(error);
            }).then((block) => {
              block.subsidy = x.subsidy / 100000000;
              block.feesPaid = x.totalfee /  100000000;
              // TODO: evaluate TX inclusion
              block.tx = null;
              resolve(block);
            });
          });
        }));

        // TODO: read transactions from recent blocks
        const transactions = [];

        // Loop through all blocks until we have 5 transactions
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          // Calculate the total value of the block
          // block.value = (block.tx) ? block.tx.reduce((acc, x) => acc + x.vout.reduce((acc, x) => acc + x.value, 0), 0) : 0;
          block.value = 0;
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
          }
        }

        return res.send(blocks);
      }
    });
  }

  async _handleBitcoinTransactionRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        if (!req.params.txhash) return res.send({ status: 'error', message: 'Transaction hash is required.' });
        const tx = await this.bitcoin._makeRPCRequest('getrawtransaction', [req.params.txhash]);
        res.send(tx);
      }
    })
  }

  async _handleBitcoinTransactionListRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        // TODO: allow various parameters (sort order, cursor start, etc.)
        // TODO: cache each of these queries
        // TODO: cache this request overall
        const height = await this.bitcoin._makeRPCRequest('getblockcount', []);
        const promises = [];
        const count = 10;

        for (let i = 0; i < count; i++) {
          promises.push(this.bitcoin._makeRPCRequest('getblockstats', [height - i]));
        }

        const blockstats = await Promise.all(promises);
        const blocks = await Promise.all(blockstats.map(async (x) => {
          return new Promise((resolve, reject) => {
            this.bitcoin._makeRPCRequest('getblock', [x.blockhash, 1]).catch((error) => {
              reject(error);
            }).then((block) => {
              block.subsidy = x.subsidy / 100000000;
              block.feesPaid = x.totalfee /  100000000;
              // TODO: evaluate TX inclusion
              block.tx = null;
              resolve(block);
            });
          });
        }));

        // TODO: read transactions from recent blocks
        const transactions = [];

        // Loop through all blocks until we have 5 transactions
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          // Calculate the total value of the block
          // block.value = (block.tx) ? block.tx.reduce((acc, x) => acc + x.vout.reduce((acc, x) => acc + x.value, 0), 0) : 0;
          block.value = 0;
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
          }
        }

        return res.send(blocks);
      }
    });
  }

  async _handleBitcoinStatusRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        // TODO: cache each of these queries
        // TODO: cache this request overall
        const blockchain = await this.bitcoin._makeRPCRequest('getblockchaininfo', []);
        const best = await this.bitcoin._makeRPCRequest('getbestblockhash', []);
        const height = await this.bitcoin._makeRPCRequest('getblockcount', []);
        const utxoutset = await this.bitcoin._makeRPCRequest('gettxoutsetinfo', []);
        const mempoolinfo = await this.bitcoin._makeRPCRequest('getmempoolinfo', []);
        const tip = await this.bitcoin._makeRPCRequest('getblockheader', [best]);
        const market = await this.bitcoin._makeRPCRequest('getblockstats', [tip]);
        const blockstats = await Promise.all([
          this.bitcoin._makeRPCRequest('getblockstats', [height]),
          this.bitcoin._makeRPCRequest('getblockstats', [height - 1]),
          this.bitcoin._makeRPCRequest('getblockstats', [height - 2]),
          this.bitcoin._makeRPCRequest('getblockstats', [height - 3]),
          this.bitcoin._makeRPCRequest('getblockstats', [height - 4]),
          this.bitcoin._makeRPCRequest('getblockstats', [height - 5])
        ]);

        const blocks = await Promise.all(blockstats.map(async (x) => {
          const block = await this.bitcoin._makeRPCRequest('getblock', [x.blockhash, 2]);
          block.subsidy = x.subsidy / 100000000;
          block.feesPaid = x.totalfee /  100000000;
          return block;
        }));

        // TODO: read transactions from recent blocks
        const transactions = [];

        // Loop through all blocks until we have 5 transactions
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
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

          // TODO: evaluate TX inclusion
          blocks[i].tx = null;

          // Do we have enough transactions?
          if (transactions.length >= 5) break;
        }

        const status = {
          network: this.bitcoin.network,
          genesisHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
          blockChain: blockchain,
          blockDate: tip.time,
          blockHeight: this.bitcoin.height,
          supply: utxoutset.total_amount,
          status: 'ONLINE', // TODO: check for syncing status
          tip: best,
          height: height,
          mempoolInfo: mempoolinfo,
          mempoolSize: mempoolinfo.usage,
          unspentTransactions: utxoutset.transactions,
          unspentOutputs: utxoutset.txouts,
          market: market,
          recentBlocks: blocks,
          recentTransactions: transactions,
          syncActive: blockchain.initialblockdownload,
          syncProgress: blockchain.verificationprogress
        };

        res.json(status);
      }
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
        console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Response:', response);
        this.discord._sendToChannel(activity.target.ref, response.content);
      });

      console.debug('[SENSEMAKER:CORE]', '[DISCORD]', 'Request:', request);
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

  async _handleDiscordStatusRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        const guilds = await this.discord._listGuilds();
        const status = {
          guilds: guilds
        };

        res.send(status);
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

  async _handleMatrixStatusRequest (req, res, next) {
    res.format({
      html: () => {
        res.send(this.applicationString);
      },
      json: async () => {
        const rooms = await this.matrix._listPublicRooms();
        res.send({
          rooms: rooms
        });
      }
    });
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

    const roomID = activity.target.path.split('/')[2];
    const computingIcon = '⌛';
    const completedIcon = '✅';

    let userID = null;
    let conversationID = null;
    let computingReaction = null;
    let completedReaction = null;
    let log = [];

    // Create (or Restore) Identities
    let id = null;
    const identity = await this.db('identities').where({ source: 'matrix', content: activity.actor.ref }).first();
    if (!identity) {
      const actor = new Actor({ name: `matrix/users/${activity.actor.ref}` });
      const ids = await this.db('identities').insert({
        fabric_id: actor.id,
        source: 'matrix',
        content: activity.actor.ref
      });

      const duser = await this.db('identities').insert({
        fabric_id: actor.id,
        source: 'matrix',
        content: activity.actor.username
      });

      id = ids[0];
    } else {
      id = identity.id;
    }

    const retrieved = await this.db('users').where({ matrix_id: activity.actor.ref }).first();
    if (!retrieved) {
      const newUser = await this.db('users').insert({
        matrix_id: activity.actor.ref,
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
        matrix_id: activity.target.ref,
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

    // TODO: handle error
    const inserted = await this.db('messages').insert({
      conversation_id: conversationID,
      content: activity.object.content,
      user_id: userID
    });

    log.push(inserted[0]);

    await this.db('conversations').where({ id: conversationID }).update({
      // updated_at: new Date().toISOString(),
      log: JSON.stringify(log),
      title: `Matrix Chat with ${activity.actor.username}`
    });

    const reactions = await this.matrix._getReactions(activity.object.id);
    if (!reactions.filter((x) => (x.key == computingIcon)).length) {
      try {
        computingReaction = await this.matrix._react(activity.object.id, computingIcon);
      } catch (exception) {

      }
    }

    this.handleTextRequest({
      conversation_id: conversationID,
      query: activity.object.content,
      platform: 'matrix',
      // username: activity.actor.username
    }).catch((error) => {
      console.error('Error handling text request:', error);
    }).then(async (response) => {
      const proposal = { object: response.content };
      this.matrix._send(proposal, roomID);

      if (computingReaction) await this.matrix._redact(computingReaction.object.id);

      // Set reactions to reflect completed status
      const latestReactions = await this.matrix._getReactions(activity.object.id);
      if (!latestReactions.filter((x) => (x.key === completedIcon)).length) {
        try {
          completedReaction = await this.matrix._react(activity.object.id, completedIcon);
        } catch (exception) {

        }
      }
    });

    return true;
  }

  async _handleMatrixReplay (activity) {
    console.debug('[SENSEMAKER:CORE]', '[MATRIX]', 'Replay:', activity);
  }

  async _handleFabricActivity (activity) {
    console.debug('[FABRIC]', '[ACTIVITY]', activity);
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

  async _handleFabricMessage (activity) {
    console.debug('[FABRIC]', '[ACTIVITY]', activity);
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
        date_of_death: person.date_of_death
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
      /* const members = await this.matrix.client.getJoinedRoomMembers(room);
      console.log(`room ${room} has ${Object.keys(members.joined).length}`);
      if (!Object.keys(members.joined).includes('@eric:fabric.pub')) {
        try {
          await this.matrix.client.invite(room, '@eric:fabric.pub');
        } catch (exception) {
          console.warn('[SENSEMAKER:CORE]', '[MATRIX]', 'Failed to invite admin to room:', room);
        }
      } */
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
      request.filter = { '@type': 'document' };

      // Use vector search
      this.trainer.search(request, 1).then(async (results) => {
        let response = [];
        console.debug('search results:', results.content);
        for (let i = 0; i < results.content.length; i++) {
          const result = results.content[i];
          switch (result.metadata?.type) {
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
              console.debug('[SEARCH]', '[DOCUMENTS]', 'Unknown result type:', result?.metadata?.type);
              response.push({ content: result.content, metadata: { type: 'unknown', id: null }, object: result });
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
      if (this.settings.debug) console.debug('found authorization header:', req.headers.authorization);
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
