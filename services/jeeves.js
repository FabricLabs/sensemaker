'use strict';

// Prepare transpilation
require('@babel/register');

// Package
const definition = require('../package');
const {
  AGENT_MAX_TOKENS,
  MAX_RESPONSE_TIME_MS,
  PER_PAGE_LIMIT,
  PER_PAGE_DEFAULT,
  SEARCH_CASES_MAX_WORDS,
  USER_QUERY_TIMEOUT_MS,
  SYNC_EMBEDDINGS_COUNT
} = require('../constants');

// Dependencies
const fs = require('fs');
const crypto = require('crypto');
const fetch = require('cross-fetch');
const debounce = require('lodash.debounce');
const merge = require('lodash.merge');
// const levelgraph = require('levelgraph');
const knex = require('knex');
const multer = require('multer');

// External Dependencies
// const { ApolloServer, gql } = require('apollo-server-express');
// TODO: use bcryptjs instead of bcrypt?
// TODO: use levelgraph instead of level?
const { attachPaginate } = require('knex-paginate'); // pagination
const { hashSync, compareSync, genSaltSync } = require('bcrypt'); // user authentication
const { getEncoding, encodingForModel } = require('js-tiktoken'); // local embeddings

// Fabric
const Hub = require('@fabric/hub'); // decentralized messaging

// HTTP Bridge
const HTTPServer = require('@fabric/http/types/server');
// const Sandbox = require('@fabric/http/types/sandbox');

// Fabric Types
// TODO: reduce to whole library import?
// const App = require('@fabric/core/types/app');
const Key = require('@fabric/core/types/key');
const Peer = require('@fabric/core/types/peer');
const Token = require('@fabric/core/types/token');
const Actor = require('@fabric/core/types/actor');
const Chain = require('@fabric/core/types/chain');
const Queue = require('@fabric/core/types/queue');
const Logger = require('@fabric/core/types/logger');
// const Worker = require('@fabric/core/types/worker');
const Message = require('@fabric/core/types/message');
const Service = require('@fabric/core/types/service');
const Collection = require('@fabric/core/types/collection');
const Filesystem = require('@fabric/core/types/filesystem');

// Sources
// const Bitcoin = require('@fabric/core/services/bitcoin');
// const WebHooks = require('@fabric/webhooks');
// const Discord = require('@fabric/discord');
// const Ethereum = require('@fabric/ethereum');
// const GitHub = require('@fabric/github');
const Matrix = require('@fabric/matrix');
// const Shyft = require('@fabric/shyft');
// const Twilio = require('@fabric/twilio');
// const Twitter = require('@fabric/twitter');
// const GitHub = require('@fabric/github');

// Providers
const { StatuteProvider } = require('../libraries/statute-scraper');

// Services
const Fabric = require('./fabric');
const EmailService = require('./email');
const Gemini = require('./gemini');
const PACER = require('./pacer');
const Harvard = require('./harvard');
const Mistral = require('./mistral');
const OpenAI = require('./openai');
const CourtListener = require('./courtlistener');
// const WestLaw = require('./westlaw');
const Stripe = require('./stripe');

// Internal Types
const Agent = require('../types/agent');
// const Brain = require('../types/brain');
const Learner = require('../types/learner');
const Trainer = require('../types/trainer');
const Worker = require('../types/worker');

// Components
const CaseHome = require('../components/CaseHome');
const CaseView = require('../components/CaseView');
const Conversations = require('../components/Conversations');

// Functions
const toMySQLDatetime = require('../functions/toMySQLDatetime');

// Routes (Request Handlers)
const ROUTES = {
  cases: {
    list: require('../routes/cases/get_cases'),
  },
  documents: {
    // list: require('../routes/documents/list_documents'),
    // view: require('../routes/documents/view_document'),
    search: require('../routes/documents/search_documents'),
  },
  files: {
    create: require('../routes/files/create_file'),
    list: require('../routes/files/list_files'),
    view: require('../routes/files/view_file'),
    serve: require('../routes/files/serve_file.js'),
  },
  matters: {
    create: require('../routes/matters/create_matter'),
    new: require('../routes/matters/new_matter'),
    view: require('../routes/matters/matter_view'),
    list: require('../routes/matters/list_matters'),
    addContext: require('../routes/matters/add_context'),
    removeFile: require('../routes/matters/remove_file'),
    removeNote: require('../routes/matters/remove_note'),
    newConversation: require('../routes/matters/matter_new_chat'),
    getConversations: require('../routes/matters/get_conversations'),
    edit: require('../routes/matters/edit_matter'),
    listFiles: require('../routes/matters/list_matter_files'),
    listNotes: require('../routes/matters/list_matter_notes'),
  },
  products: {
    list: require('../routes/products/list_products'),
  },
  reporters: {
    search: require('../routes/reporters/search_reporters'),
  },
  jurisdictions: {
    view: require('../routes/jurisdictions/jurisdiction_view'),
  },
  courts: {
    list: require('../routes/courts/list_courts'),
    view: require('../routes/courts/court_view'),
  },
  sessions: {
    create: require('../routes/sessions/create_session')
  },
  statutes: {
    list: require('../routes/statutes/list_statutes'),
    // view: require('../routes/statutes/view_statute'), // TODO: create this
  },
  users: {
    list: require('../routes/users/list_users'),
    listFiles: require('../routes/users/list_user_files'),
    editUsername: require('../routes/users/edit_username'),
    editEmail: require('../routes/users/edit_email'),
    view: require('../routes/users/view_user'),
  },
  feedback: {
    create: require('../routes/feedback/create_feedback.js')
  }
};

/**
 * Jeeves is a Fabric-powered application, capable of running autonomously
 * once started by the user.  By default, earnings are enabled.
 * @type {Object}
 * @extends {Service}
 */
class Jeeves extends Hub {
  /**
   * Constructor for the Jeeves application.
   * @param  {Object} [settings={}] Map of configuration values.
   * @param  {Number} [settings.port=7777] Fabric messaging port.
   * @return {Jeeves} Resulting instance of Jeeves.
   */
  constructor (settings = {}) {
    super(settings);

    // Settings
    this.settings = merge({
      crawl: false,
      debug: false,
      seed: null,
      port: 7777,
      precision: 8, // precision in bits for floating point compression
      persistent: true,
      path: './logs/jeeves',
      coordinator: '!TsLXBhlUcDLbRtOYIU:fabric.pub',
      frequency: 0.01, // Hz (once every ~100 seconds)
      temperature: 0,
      rules: [
        'do not provide hypotheticals'
      ],
      db: {
        host: 'localhost',
        user: 'db_user_jeeves',
        password: '',
        database: 'db_jeeves'
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
      openai: {},
      pacer: {},
      harvard: {},
      courtlistener: {},
      statutes: {
        jurisdictions: [
          'Texas'
        ]
      },
      services: [
        'bitcoin',
        'harvard',
        'matrix'
      ],
      state: {
        status: 'INITIALIZED',
        agents: {},
        collections: {
          cases: {},
          courts: {},
          documents: {},
          people: {}
        },
        counts: {
          cases: 0,
          courts: 0,
          documents: 0,
          people: 0
        },
        services: {
          bitcoin: {
            balance: 0
          },
          courtlistener: {
            cases: 0,
            courts: 0,
            documents: 0,
            people: 0
          },
          harvard: {
            counts: {
              cases: 0,
              courts: 0,
              documents: 0,
              people: 0
            }
          }
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
    // this.sandbox = new Sandbox(this.settings.sandbox);
    this.worker = new Worker(this.settings);

    // Services
    // Optional Services
    this.email = (this.settings.email.enable) ? new EmailService(this.settings.email) : null;
    this.matrix = (this.settings.matrix.enable) ? new Matrix(this.settings.matrix) : null;
    // this.github = (this.settings.github.enable) ? new GitHub(this.settings.github) : null;
    // this.discord = (this.settings.discord.enable) ? new Discord(this.settings.discord) : null;
    this.courtlistener = (this.settings.courtlistener.enable) ? new CourtListener(this.settings.courtlistener) : null;
    this.statutes = (this.settings.statutes.enable) ? new StatuteProvider(this.settings.statutes) : null;

    // Other Services
    this.pacer = new PACER(this.settings.pacer);
    this.openai = new OpenAI(this.settings.openai);
    this.harvard = new Harvard(this.settings.harvard);
    this.stripe = new Stripe(this.settings.stripe);

    // Collections
    this.actors = new Collection({ name: 'Actors' });
    this.feeds = new Collection({ name: 'Feeds '});
    this.messages = new Collection({ name: 'Messages' });
    this.objects = new Collection({ name: 'Objects' });
    this.sources = new Collection({ name: 'Sources' });

    // TODO: use path
    // TODO: enable recursive Filesystem (directories)
    this.fs = new Filesystem({ path: './stores/jeeves' });

    // Fabric Setup
    this._rootKey = new Key({ xprv: this.settings.xprv });
    this._fabric = {
      ephemera: this._rootKey,
      token: new Token({ issuer: this._rootKey })
    };

    // Fabric
    this.fabric = new Fabric(this.settings.fabric);

    // HTTP Interface
    this.http = new HTTPServer({
      path: 'assets',
      hostname: this.settings.http.hostname,
      interface: this.settings.http.interface,
      port: this.settings.http.port,
      middlewares: {
        userIdentifier: this._userMiddleware.bind(this)
      },
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
            list: 'jeeves-index',
            view: 'jeeves-index'
          }
        },
        Service: {
          route: '/services',
          components: {
            list: 'jeeves-index',
            view: 'jeeves-index'
          }
        }
      },
      sessions: false
    });

    // File Uploads
    this.uploader = new multer({ dest: this.settings.files.path });

    this.openai.settings.temperature = this.settings.temperature;
    this.apollo = null;

    // Internals
    this.healths = {};
    this.services = {};
    this.sources = {};
    this.workers = [];
    this.changes = new Logger({
      name: 'jeeves',
      path: './stores'
    });

    // Sensemaker
    this.sensemaker = new Agent({
      name: 'SENSEMAKER',
      model: 'llama2',
      rules: this.settings.rules,
      host: this.settings.ollama.host,
      prompt: this.settings.prompt
    });

    // Agent Collection
    this.lennon = new Agent({ name: 'LENNON', rules: this.settings.rules, prompt: `You are LennonAI, designed to come up with a list of relevant citations of cases and statutes.  Use analytical reasoning to determine the best historical cases to cite, including text from the arguments and closing opinions.`, openai: this.settings.openai });
    this.alpha = new Agent({ name: 'ALPHA', prompt: this.settings.prompt, openai: this.settings.openai });
    this.beta = new Agent({ name: 'BETA', model: 'llama2', host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt, openai: this.settings.openai });
    this.gamma = new Agent({ name: 'GAMMA', model: 'llama2', host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt, openai: this.settings.openai });
    this.delta = new Agent({ name: 'DELTA', model: 'llama2', host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt, openai: this.settings.openai });

    // External Agents
    // this.gemini = new Gemini({ name: 'GEMINI', prompt: this.settings.prompt, ...this.settings.gemini, openai: this.settings.openai });

    // Well-known Models
    this.llama = new Agent({ name: 'LLAMA', model: 'llama2', host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt, openai: this.settings.openai });
    this.mistral = new Agent({ name: 'MISTRAL', model: 'mistral', host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt });
    this.mixtral = new Agent({ name: 'MIXTRAL', model: 'mixtral', host: 'ollama.jeeves.dev', port: 443, secure: this.settings.ollama.secure, prompt: this.settings.prompt });
    this.gemma = new Agent({ name: 'GEMMA', model: 'gemma', host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: this.settings.prompt });

    // Custom Models
    this.searcher = new Agent({ name: 'SEARCHER', model: 'llama2', rules: this.settings.rules, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure, prompt: 'You are SearcherAI, designed to return only a search term most likely to return the most relevant results to the user\'s query, assuming your response is used elsewhere in collecting information from the Novo database.  Refrain from using generic terms such as "case", "v.", "vs.", etc., and simplify the search wherever possible to focus on the primary topic.  Only ever return the search query as your response.  For example, when the inquiry is: "Find a case that defines the scope of First Amendment rights in online speech." you should respond with "First Amendment" (excluding the quote marks).  Your responses will be sent directly to the network, so make sure to only ever respond with the best candidate for a search term for finding documents most relevant to the user question.  Leverage abstractions to extract the essence of the user request, using step-by-step reasoning to predict the most relevant search term.' });
    this.usa = new Agent({ name: 'USA', model: 'llama2', prompt: this.settings.prompt, host: this.settings.ollama.host, port: this.settings.ollama.port, secure: this.settings.ollama.secure });

    // Pipeline Datasources
    this.datasources = {
      bitcoin: { name: 'Bitcoin' },
      courtlistener: { name: 'CourtListener' },
      harvard: { name: 'Harvard' },
      pacer: { name: 'PACER' },
      statutes: { name: 'Statutes' }
    };

    // Streaming
    this.completions = {};

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
          // console.debug('[JEEVES]', '[DB]', 'Connection created.');
          done(null, conn);
        }
      }
    });

    attachPaginate();

    // Stop case
    /* process.on('exit', async () => {
      console.warn('Jeeves is shutting down...');
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
    // console.debug('[JEEVES]', '[COMMIT]', 'Committing state:', this._state);
    const commit = new Actor({
      type: 'Commit',
      object: {
        content: this.state
      }
    });

    // console.warn('Jeeves is attempting a safe shutdown...');
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
    this._state.agents[agent.id] = agent;
    this._state.content.agents[agent.id] = configuration;
    this.commit();
    this.emit('agent', agent);
    return agent;
  }

  estimateTokens (input) {
    const tokens = input.split(/\s+/g);
    const estimate = tokens.length * 4;
    return estimate;
  }

  importantPhrases (input) {
    const tokens = input.replace(/[^\w\s\']|_/g, '').split(/\s+/g);
    const uniques = [...new Set(tokens)].filter((x) => x.length > 3);

    uniques.sort((a, b) => {
      return b.length - a.length;
    });

    return uniques;
  }

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

  properNouns (input) {
    return this.uniqueWords(input).filter((word) => /^[A-Z][a-z]*$/.test(word));
  }

  uniqueWords (input) {
    return [...new Set(this.words(input))].filter((x) => x.length > 3);
  }

  words (input) {
    return this.wordTokens(input);
  }

  wordTokens (input) {
    return input.replace(/[^\w\s\']|_/g, '').split(/\s+/g);
  }

  async alert (message) {
    if (this.email) {
      try {
        // Alert Tech
        await this.email.send({
            from: 'agent@trynovo.com',
            to: 'tech@jeeves.dev',
            subject: `[ALERT] [JEEVES] Jeeves Alert`,
            html: message
        });
        console.debug('Alert email sent successfully!');
      } catch (error) {
        console.error('Error sending alert email:', error);
      }
    }
  }

  async tick () {
    const now = (new Date()).toISOString();
    this._lastTick = now;
    this._state.clock = ++this.clock;
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
    console.debug('[JEEVES]', '[BEAT]', 'Start:', start);

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
        { query: 'Cases not yet synchronized with Jeeves.' }
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
      const results = await Promise.allSettled([
        this.alpha.query({ query: CHAT_QUERY }),
        this.llama.query({ query: CHAT_QUERY }),
        this.gemma.query({ query: CHAT_QUERY }),
      ]);

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

      console.debug('[NOVO]', '[PIPELINE]', 'Handling request:', request);
      console.debug('[NOVO]', '[PIPELINE]', 'Initial query:', request.query);
      console.trace('[NOVO]', '[PIPELINE]', 'Initial messages:', request.messages);
      console.debug('[NOVO]', '[PIPELINE]', 'Initial timeout:', request.timeout);
      if (this.settings.debug) console.debug('[NOVO]', '[PIPELINE]', 'Handling request:', request);

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

      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Created response placeholder message:', responseMessage);

      // Create Request Message
      const message = Message.fromVector(['TimedRequest', JSON.stringify({
        created: created,
        request: request,
        response_message_id: responseMessage[0]
      })]);

      // Notify workers
      this.emit('request', { id: inserted [0] });

      // TODO: prepare maximum token length
      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Request:', request);

      // Get Matter, if relevant
      if (request.matter_id) {
        request.matter = await this.db('matters').where({ id: request.matter_id }).first();
        const matterFiles = await this.db('matters_files').where({ matter_id: request.matter_id });
        request.matter.files = await this.db('files').whereIn('id', matterFiles.map((x) => x.file_id));
      }

      // Compute most relevant tokens
      // const caseCount = await this.db('cases').count('id as count').first();
      // const hypotheticals = await this.lennon.query({ query: request.query });
      const words = this.importantWords(request.query);
      const phrases = this.importantPhrases(request.query);
      const searchterm = await this.searcher.query({ query: `---\nquery:\n  ${request.query}\nmatter: ${JSON.stringify(request.matter || null)}\n---\nConsidering the metadata, what search term do you recommend?  Remember, return only the search term.`, tools: null, messages: request.messages });
      if (this.settings.debug) this.emit('debug', `Search Term: ${JSON.stringify(searchterm, null, '  ')}`);
      console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Search Term content:', searchterm.content);

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

      console.debug('[NOVO]', '[PIPELINE]', 'Final Search Term:', searchterm.content);

      // Search for cases
      const cases = await this._vectorSearchCases(searchterm.content);
      const recently = await this.db('cases').orderBy('created_at', 'desc').limit(5);

      /*
      const realCases = await this.harvard.search({ query: searchterm.content });
      console.debug('[JEEVES]', '[TIMEDREQUEST]', 'REAL CASES:', realCases);
      */

      // console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Hypotheticals:', hypotheticals);
      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Phrases:', phrases);
      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Real Cases:', cases);

      // Format Metadata
      const meta = `metadata:\n` +
        `  created: ${created}\n` +
        `  notes: Cases may be unrelated, search term used: ${searchterm.content || ''}\n` +
        `  matter: ${JSON.stringify(request.matter || null)}\n` +
        `  topics: ${searchterm.content || ''}\n` +
        `  words: ${words.slice(0, 10).join(', ') + ''}\n` +
        `  documents: null\n` +
        `  cases:\n` +
        cases.concat(recently).map((x) => `    - [novo/cases/${x.id}] "${x.citation || 'undefined citation'}" "${x.title || 'undefined title'}"`).join('\n') +
        // `\n` +
        // `  counts:\n` +
        // `    cases: ` + caseCount.count +
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

      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Meta:', meta);
      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Meta Token Count:', metaTokenCount);
      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Request Token Count:', requestTokenCount);
      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Available Tokens:', AGENT_MAX_TOKENS - metaTokenCount - requestTokenCount);
      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Estimated query embedding cost:', estimatedCost);

      let messages = [];

      if (request.conversation_id) {
        // Resume conversation
        const prev = await this._getConversationMessages(request.conversation_id);
        messages = prev.map((x) => {
          return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
        });
      } else {
        // New conversation
        messages = messages.concat([{ role: 'user', content: request.query }]);
      }

      if (request.subject) {
        // Subject material provided
        messages.unshift({ role: 'user', content: `Questions will be pertaining to ${request.subject}.` });
      }

      if (request.matter_id) {
        console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Request pertains to Matter ID:', request.matter_id);
        const matter = await this.db('matters').where({ id: request.matter_id }).first();
        const matterFiles = await this.db('matters_files').where({ matter_id: request.matter_id });
        const files = await this.db('files').whereIn('id', matterFiles.map((x) => x.file_id));

        matter.files = files;

        console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Matter:', matter);
        console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Files:', files);

        messages = messages.concat([{ role: 'user', content: `Questions will be pertaining to ${matter.title}:\n\n\`\`\`\n${JSON.stringify(matter)}\n\`\`\`` }]);
      }

      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Matter Messages:', messages);

      // Prompt
      messages.unshift({
        role: 'system',
        content: this.settings.prompt
      });

      if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Messages to evaluate:', messages);

      // Consensus Agents
      const agentResults = Promise.allSettled([
        this.alpha.query({ query, messages }), // ChatGPT
        this.beta.query({ query, messages }), // Ollama
        // this.gemini.query({ query, messages }), // requires USA-based egress
        // this.lennon.query({ query, messages }), // Adversarial RAG
        this.llama.query({ query, messages, requery: true }), // Ollama
        // this.gemma.query({ query, messages, requery: true }), // Ollama
        // this.mistral.query({ query, messages }), // Ollama
        // this.mixtral.query({ query, messages }), // Ollama
      ]);

      // TODO: execute RAG query for additional metadata
      const ragger = new Agent({ host: this.settings.ollama.host, secure: this.settings.ollama.secure, messages: messages, prompt: `You are RagAI, an automated agent designed to generate a SQL query returning case IDs from a local case database most likely to pertain to the user query.  The database is MySQL, table named "cases" — fields are "title" and "summary".  Available hosts: beta.jeeves.dev, gamma.trynovo.com`, openai: this.settings.openai });

      Promise.race([
        new Promise((resolve, reject) => {
          setTimeout(reject, timeout, new Error('Timeout!'));
        }),
        agentResults
      ]).then(async (results) => {
        if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Results:', results);
        const answers = results.filter((x) => x.status === 'fulfilled').map((x) => x.value);
        if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Answers:', answers);

        /* for (let i = 0; i < answers.length; i++) {
          const answer = answers[i];
          if (!answer.content) continue;

          const ragged = await ragger.query({ query: `$CONTENT\n\`\`\`\n${answer.content}\n\`\`\`` });
          console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Ragged:', ragged);
        } */

        const agentList = `${answers.map((x) => `- [${x.name}] ${x.content}`).join('\n')}`;
        if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Agent List:', agentList);
        // TODO: loop over all agents
        // TODO: compress to 4096 tokens
        const summarized = await this.summarizer.query({
          messages: messages,
          query: 'Answer the user query using the various answers provided by the agent network.  Use deductive logic and reasoning to verify the information contained in each, and respond as if their answers were already incorporated in your core knowledge.  The existence of the agent network, or their names, should not be revealed to the user.  Write your response as if they were elements of your own memory.\n\n```\nquery: ' + query + '\nagents:\n' + agentList + `\n\`\`\``,
        });

        if (this.settings.debug) console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Summarized:', summarized);
        const actor = new Actor({ content: summarized.content });
        const bundle = {
          type: 'TimedResponse',
          content: summarized.content
        };

        /* const extracted = await this.extractor.query({
          query: `$CONTENT\n\`\`\`\n${summarized.content}\n\`\`\``
        });
        console.debug('[JEEVES]', '[HTTP]', 'Got extractor output:', extracted);

        if (extracted && extracted.content) {
          console.debug('[JEEVES]', '[EXTRACTOR]', 'Extracted:', extracted);
          try {
            const caseCards = JSON.parse(extracted.content).map((x) => {
              const actor = new Actor({ name: x });
              return {
                type: 'CaseCard',
                content: {
                  id: actor.id,
                  title: x
                }
              };
            });

            console.debug('[JEEVES]', '[HTTP]', '[MESSAGE]', 'Case Cards:', caseCards)

            // Find each case in the database and reject if not found
            /* const updated = await this.db('messages').where({ id: newMessage[0] }).update({
              cards: JSON.stringify(caseCards.map((x) => x.content.id))
            }); */
          /* } catch (exception) {
            console.error('[JEEVES]', '[HTTP]', '[MESSAGE]', 'Error updating cards:', exception);
          }
        } */

        try {
          const documentIDs = await this.db('documents').insert({
            fabric_id: actor.id,
            content: summarized.content
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

          console.debug('[JEEVES]', '[HTTP]', '[MESSAGE]', 'Updated message:', updated);

          this.emit('response', {
            id: responseIDs[0],
            content: summarized.content
          });
        } catch (exception) {
          console.error('[JEEVES]', '[HTTP]', '[MESSAGE]', 'Error inserting response:', exception);
        }

        const end = new Date();
        console.debug('[JEEVES]', '[TIMEDREQUEST]', 'Duration:', (end.getTime() - now.getTime()) / 1000, 'seconds.');

        resolve(summarized);
      }).catch((exception) => {
        console.error('[JEEVES]', '[TIMEDREQUEST]', 'Exception:', exception);
        reject(exception);
      });
    });
  }

  async findCaseByName (name) {
    const instance = await this.db('cases').where('name', name).first();
    console.debug('[JEEVES]', 'Found case by name:', instance);
    return instance;
  }

  async findCourtByName (name) {
    const court = await this.db('courts').where('name', name).first();
    const result = await Promise.race([
      new Promise(async (resolve, reject) => {
        try {
          const instance = await this.courtlistener.db('search_court').select('*').where('name', name).first();
          console.debug('[NOVO]', '[COURT]', 'Found court by name:', instance);
          resolve(instance);
        } catch (exception) {
          console.error('[NOVO]', '[COURT]', 'Error searching court:', exception);
          reject(exception);
        }
      })
    ]);

    // console.debug('[JEEVES]', 'Found court by name:', court);
    console.debug('[JEEVES]', 'Court search by name, results:', result);

    return court;
  }

  async _getState () {
    // WARNING: this loads the int32 for every entity in the database
    const cases = await this.db('cases').select('id').from('cases');
    const courts = await this.db('courts').select('id').from('courts');
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
      cases: {
        total: cases.length,
        // content: cases.map(x => x.id)
      },
      conversations: {
        total: conversations.length,
        // content: conversations.map(x => x.id)
      },
      courts: {
        total: courts.length,
        // content: courts.map(x => x.id)
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
    const other = await this._getUnprocessedCaseStats();
    const chunk = await this._getUnprocessedCases(limit);

    console.debug('[JEEVES]', '[ETL]', 'Stats:', other, stats);

    const start = new Date();
    for (let i = 0; i < chunk.length; i++) {
      const instance = chunk[i];
      console.debug('[JEEVES]', '[ETL]', 'Processing case:', instance.title, `[${instance.id}]`);
      // const nativeEmbedding = await this._generateEmbedding(`[novo/cases/${instance.id}] ${instance.title}`);
      const titleEmbedding = await this._generateEmbedding(instance.title);
      await this.db('cases').where('id', instance.id).update({ title_embedding_id: titleEmbedding.id });
      stats.processed++;
    }

    console.debug('[JEEVES]', '[ETL]', 'Complete in ', (new Date().getTime() - now.getTime()) / 1000, 'seconds.');
    console.debug('[JEEVES]', '[ETL]', `Generated ${stats.processed} embeddings in ${(new Date().getTime() - start.getTime()) / 1000} seconds. (${stats.processed / ((new Date().getTime() - start.getTime()) / 1000)} embeddings per second)`);

    return this;
  }

  async _getUnprocessedCases (limit = 20) {
    const cases = await this.db('cases').select('id', 'title', 'summary', 'title_embedding_id', 'body_embedding_id').where(function () {
      this.whereNull('title_embedding_id')// .orWhereNull('body_embedding_id')
    }).limit(limit);

    return cases;
  }

  async _getUnprocessedCaseStats () {
    const caseCount = await this.db('cases').count('id as count').first();
    const withTitleEmbeddings = await this.db('cases').count('id as count').whereNotNull('title_embedding_id').first();
    const missingTitleEmbeddings = await this.db('cases').count('id as count').whereNull('title_embedding_id').first();

    return {
      total: caseCount,
      withTitleEmbeddings: withTitleEmbeddings,
      missingTitleEmbeddings: missingTitleEmbeddings
    };
  }

  async query (query) {
    console.debug('[JEEVES]', '[QUERY]', 'Received query:', query);
    const collections = {
      courts: {}
    };

    const candidates = await Promise.allSettled([
      (new Promise((resolve, reject) => {
        setTimeout(reject, USER_QUERY_TIMEOUT_MS, new Error('Timeout!'));
      })),
      this._searchCourts(query)
    ]);

    console.debug('[JEEVES]', '[QUERY]', 'Candidates:', candidates);

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

  async search (request) {
    console.debug('[JEEVES]', '[SEARCH]', 'Received search request:', request);
    const redisResults = await this.trainer.search(request);
    console.debug('[JEEVES]', '[SEARCH]', 'Redis Results:', redisResults);

    const cases = await this._searchCases(request);
    // const courts = await this._searchCourts(request);
    // const documents = await this._searchDocuments(request);
    // const people = await this._searchPeople(request);

    const elements = [];

    for (let i = 0; i < cases.length; i++) {
      const instance = cases[i];
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
      console.debug('[JEEVES]', '[SEARCH]', '[CONVERSATIONS]', 'Found results:', results);
    }

    const messages = await this.db('messages').select('id').where('content', 'like', `%${request.query}%`);
    const conversations = await this.db('conversations').in('id', messages.map((message) => message.conversation_id)).paginate({
      perPage: PER_PAGE_DEFAULT,
      currentPage: 1
    });

    console.debug('[JEEVES]', '[SEARCH]', '[CONVERSATIONS]', 'Found conversations:', conversations);

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
    this.applicationString = fs.readFileSync('./assets/index.html').toString('utf8');

    // Redis
    try {
      await this.trainer.start();
    } catch (exception) {
      console.error('[JEEVES]', '[REDIS]', 'Error starting Redis:', exception);
      process.exit();
    }

    /* this.db.on('error', (...error) => {
      console.error('[JEEVES]', '[DB]', '[ERROR]', ...error);
    }); */

    // Register Services
    // await this._registerService('webhooks', WebHooks);
    // await this._registerService('bitcoin', Bitcoin);
    // await this._registerService('discord', Discord);
    // await this._registerService('ethereum', Ethereum);
    // await this._registerService('github', GitHub);
    // await this._registerService('matrix', Matrix);
    // await this._registerService('twilio', Twilio);
    // await this._registerService('twitter', Twitter);
    // await this._registerService('shyft', Shyft);
    // await this._registerService('github', GitHub);
    // await this._registerService('pricefeed', Prices);

    // this.products = await this.stripe.enumerateProducts();

    if (this.settings.statutes.enable && this.statutes) {
      this.statutes.start().then((output) => {
        console.debug('[JEEVES]', '[STATUTES]', 'Started:', output);
      });
    }

    // Primary Worker
    // Job Types
    this.worker.register('SearchCourts', async (...params) => {
      console.debug('[WORKER]', 'Searching courts:', params);
      return this._searchCourts(...params);
    });

    this.worker.register('DownloadMissingRECAPDocument', async (...params) => {
      console.debug('[WORKER]', 'Downloading missing RECAP document:', params);
      const target = await self.db('documents')
        .where(function () {
          this.where('pdf_acquired', 0).orWhereNull('pdf_acquired');
        })
        .whereNotNull('courtlistener_filepath_ia')
        .where(self.db.raw('LENGTH(courtlistener_filepath_ia)'), '>', 0)
        .first();

      if (!target) {
        console.debug('No target found!');
        return;
      };

      const url = target.courtlistener_filepath_ia;
      const doc = await fetch(url);
      const blob = await doc.blob();
      const buffer = await blob.arrayBuffer();
      const body = Buffer.from(buffer);

      try {
        fs.writeFileSync(`stores/recap/${target.courtlistener_id}.pdf`, body);
      } catch (exception) {
        this.emit('error', `Worker could not write RECAP file: ${exception}`);
        return;
      }

      try {
        await self.db('documents').update({
          pdf_acquired: true
        }).where('courtlistener_id', target.courtlistener_id);
      } catch (exception) {
        this.emit('error', `Worker could not update database: ${params} ${exception}`);
      }
    });

    this.worker.register('Ingest', async (...params) => {
      console.debug('[WORKER]', 'Ingesting:', params);
      try {
        await self.db('cases').update({
          last_harvard_crawl: this.db.raw('now()')
        }).where('id', params[2].id);
      } catch (exception) {
        this.emit('error', `Worker could not update database: ${params} ${exception}`);
      }

      const doc = await fetch(params[0], {
        headers: {
          'Authorization': `Token ${this.settings.harvard.token}`
        }
      });

      const blob = await doc.blob();
      const buffer = await blob.arrayBuffer();
      const body = Buffer.from(buffer);

      try {
        fs.writeFileSync(params[1], body);
      } catch (exception) {
        this.emit('error', `Worker could not write file ${params[1]} ${params[2]} ${exception}`);
        return;
      }

      try {
        await self.db('cases').update({
          pdf_acquired: true
        }).where('id', params[2].id);
      } catch (exception) {
        this.emit('error', `Worker could not update database: ${params} ${exception}`);
      }

      console.debug('Ingest complete:', params[1]);
    });

    this.worker.register('ScanCourtListener', async (...params) => {
      console.debug('[WORKER]', 'Scanning CourtListener:', params);
      // console.debug('SCANNING COURT LISTENER WITH PARAMS:', params);
      /* try {
        const dockets = await this.courtlistener.query('search_docket').select('*').limit(5);
        console.debug('POSTGRES DOCKETS:', dockets.data);
      } catch (exception) {
        console.error('COURTLISTENER ERROR:', exception);
      } */
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

    // Collect Jeeves-specific
    // Courts
    this.fabric.on('document', this._handleFabricDocument.bind(this));
    this.fabric.on('court', this._handleFabricCourt.bind(this));
    this.fabric.on('person', this._handleFabricPerson.bind(this));

    // Matrix Events
    if (this.matrix) {
      this.matrix.on('activity', this._handleMatrixActivity.bind(this));
      this.matrix.on('ready', this._handleMatrixReady.bind(this));
      this.matrix.on('error', this._handleMatrixError.bind(this));
    }

    // PACER Events
    this.pacer.on('debug', this._handlePACERDebug.bind(this));
    this.pacer.on('court', this._handlePACERCourt.bind(this));

    // Harvard Events
    this.harvard.on('error', this._handleHarvardError.bind(this));
    this.harvard.on('debug', this._handleHarvardDebug.bind(this));
    this.harvard.on('warning', this._handleHarvardWarning.bind(this));
    this.harvard.on('sync', this._handleHarvardSync.bind(this));
    this.harvard.on('document', this._handleHarvardDocument.bind(this));
    this.harvard.on('court', this._handleHarvardCourt.bind(this));
    this.harvard.on('jurisdiction', this._handleHarvardJurisdiction.bind(this));
    this.harvard.on('reporter', this._handleHarvardReporter.bind(this));
    this.harvard.on('volume', this._handleHarvardVolume.bind(this));

    // OpenAI Events
    this.openai.on('error', this._handleOpenAIError.bind(this));
    this.openai.on('MessageStart', this._handleOpenAIMessageStart.bind(this));
    this.openai.on('MessageChunk', this._handleOpenAIMessageChunk.bind(this));
    this.openai.on('MessageEnd', this._handleOpenAIMessageEnd.bind(this));
    this.openai.on('MessageWarning', this._handleOpenAIMessageWarning.bind(this));

    // CourtListener Events
    if (this.courtlistener) {
      this.courtlistener.on('sync', (sync) => {
        console.debug('[JEEVES]', '[COURTLISTENER]', '[SYNC]', sync);
      });

      this.courtlistener.on('debug', (...debug) => {
        console.debug('[JEEVES]', '[COURTLISTENER]', '[DEBUG]', ...debug);
      });

      this.courtlistener.on('error', (...error) => {
        console.error('[JEEVES]', '[COURTLISTENER]', '[ERROR]', ...error);
      });

      this.courtlistener.on('warning', (...warning) => {
        console.warn('[JEEVES]', '[COURTLISTENER]', '[WARNING]', ...warning);
      });

      this.courtlistener.on('message', (message) => {
        console.debug('[JEEVES]', '[COURTLISTENER]', '[MESSAGE]', message);
      });

      this.courtlistener.on('document', this._handleCourtListenerDocument.bind(this));
      this.courtlistener.on('court', async (court) => {
        const actor = new Actor({ name: `courtlistener/courts/${court.id}` });
        const target = await this.db('courts').where({ courtlistener_id: court.id }).first();
        if (!target) {
          await this.db('courts').insert({
            fabric_id: actor.id,
            slug: court.id,
            start_date: court.start_date,
            end_date: court.end_date,
            courtlistener_id: court.id,
            founded_date: court.start_date,
            name: court.full_name,
            short_name: court.short_name,
            citation_string: court.citation_string,
            jurisdiction: court.jurisdiction,
            url: court.url
          });
        }
      });

      this.courtlistener.on('person', async (person) => {
        const actor = new Actor({ name: `courtlistener/people/${person.id}` });
        const target = await this.db('people').where({ courtlistener_id: person.id }).first();
        if (!target) {
          if (this.settings.debug) console.debug('[JEEVES]', '[COURTLISTENER]', '[PERSON]', 'No target found, inserting person:', person);
          await this.db('people').insert({
            fabric_id: actor.id,
            courtlistener_id: person.id,
            name_first: person.name_first,
            name_middle: person.name_middle,
            name_last: person.name_last,
            name_suffix: person.name_suffix,
            date_of_birth: person.date_dob,
            date_of_death: person.date_dod,
            birth_city: person.dob_city,
            birth_state: person.dob_state,
            death_city: person.dod_city,
            death_state: person.dod_state
          });
        }
      });

      this.courtlistener.on('docket', this._handleCourtListenerDocket.bind(this));
      this.courtlistener.on('opinioncluster', async (cluster) => {
        const target = await this.db('opinions').where({ courtlistener_cluster_id: cluster.id }).first();

        if (!target) {
          await this.db('opinions').insert({
            courtlistener_cluster_id: cluster.id,
            scdb_id: (cluster.scdb_id) ? cluster.scdb_id : null,
            date_created: cluster.date_created,
            date_modified: cluster.date_modified,
            date_filed: cluster.date_filed,
            judges: cluster.judges,
            case_name: cluster.case_name,
            case_name_short: cluster.case_short,
            case_name_full: cluster.case_name_full,
            scdb_decision_direction: cluster.scdb_decision_direction,
            scdb_votes_majority: cluster.scdb_votes_majority,
            scdb_votes_minority: cluster.scdb_votes_minority,
            source: cluster.source,
            procedural_history: cluster.procedural_history,
            attorneys: cluster.attorneys,
            nature_of_suit: cluster.nature_of_suit,
            posture: cluster.posture,
            syllabus: cluster.syllabus,
            precedential_status: cluster.precedential_status,
            date_blocked: cluster.date_blocked,
            blocked: cluster.blocked,
            courtlistener_docket_id: cluster.docket_id,
            date_filed_is_approximate: cluster.date_filed_is_approximate,
            correction: cluster.correction,
            cross_reference: cluster.cross_reference,
            disposition: cluster.disposition,
            filepath_json_harvard: cluster.filepath_json_harvard,
            headnotes: cluster.headnotes,
            history: cluster.history,
            other_dates: cluster.other_dates,
            summary: cluster.summary
          });
        }
      });

      this.courtlistener.on('opinion', async (opinion) => {
        const actor = new Actor({ name: `courtlistener/opinions/${opinion.id}` });
        const target = await this.db('opinions').where({ courtlistener_id: opinion.id }).first();

        if (!target) {
          await this.db('opinions').insert({
            sha1: opinion.sha1,
            date_created: opinion.date_created,
            date_modified: opinion.date_modified,
            courtlistener_id: opinion.id,
            courtlistener_cluster_id: opinion.cluster_id,
            courtlistener_download_url: opinion.download_url,
            courtlistener_local_path: opinion.local_path,
            plain_text: opinion.plain_text,
            html: opinion.html,
            html_lawbox: opinion.html_lawbox,
            html_with_citations: opinion.html_with_citations,
            extracted_by_ocr: opinion.extracted_by_ocr,
            per_curiam: opinion.per_curiam,
            page_count: opinion.page_count,
            author_str: opinion.author_str,
            joined_by_str: opinion.joined_by_str,
            xml_harvard: opinion.xml_harvard,
            html_anon_2020: opinion.html_anon_2020
          });
        }
      });

      this.courtlistener.on('person', async (person) => {
        const actor = new Actor({ name: `courtlistener/people/${person.id}` });
        const target = await this.db('people').where({ courtlistener_id: person.id }).first();
        if (!target) {
          await this.db('people').insert({
            fabric_id: actor.id,
            courtlistener_id: person.id,
            name_first: person.name_first,
            name_middle: person.name_middle,
            name_last: person.name_last,
            name_suffix: person.name_suffix,
            date_of_birth: person.date_dob,
            date_of_death: person.date_dod,
            birth_city: person.dob_city,
            birth_state: person.dob_state,
            death_city: person.dod_city,
            death_state: person.dod_state
          });
        }
      });
    }

    // Retrieval Augmentation Generator (RAG)
    this.augmentor = new Agent({ name: 'AugmentorAI', listen: false, host: this.settings.ollama.host, secure: this.settings.ollama.secure, port: this.settings.ollama.port, openai: this.settings.openai, prompt: 'You are AugmentorAI, designed to augment any input as a prompt with additional information, using a YAML header to denote specific properties, such as collection names.' });
    this.summarizer = new Agent({ name: this.settings.name, listen: false, prompt: this.prompt, /* ...this.settings.gemini,  */openai: this.settings.openai });
    this.extractor = new Agent({ name: 'ExtractorAI', listen: false, openai: this.settings.openai, prompt: 'You are CaseExtractorAI, designed extract a list of every case name in the input, and return it as a JSON array.  Use the most canonical, searchable, PACER-compatible format for each entry as possible, such that an exact text match could be returned from a database.  Only return the JSON string as your answer, without any Markdown wrapper.' });
    this.validator = new Agent({ name: 'ValidatorAI', listen: false, openai: this.settings.openai, prompt: 'You are CaseValidatorAI, designed to determine if any of the cases provided in the input are missing from the available databases.  You can use `$HTTP` to start your message to run an HTTP SEARCH against the local database, which will add a JSON list of results to the conversation.  For your final output, prefix it with `$RESPONSE`.' });

    const caseDef = await this.db.raw(`SHOW CREATE TABLE cases`);
    const documentDef = await this.db.raw(`SHOW CREATE TABLE documents`);

    this.rag = new Agent({
      name: 'AugmentorRAG',
      listen: this.settings.fabric.listen,
      openai: this.settings.openai,
      prompt: 'You are AugmentorRAG, designed to return an SQL query that returns any cases that match the provided titles.  You must not use any UPDATE or DELETE queries; ONLY use the SELECT command.\n\n' +
        'Supported tables:\n' +
        '  - cases\n' +
        '    ```' +
        caseDef[0][0]['Create Table'] +
        '    ```\n'
    });

    this.rag.on('debug', (...debug) => console.debug('[RAG]', ...debug));
    this.rag.on('log', (...log) => console.log('[RAG]', ...log));
    this.rag.on('warning', (...warning) => console.warn('[RAG]', ...warning));
    this.rag.on('error', (...error) => console.error('[RAG]', ...error));
    this.rag.on('query', this._handleRAGQuery.bind(this));

    // Load models
    await this.searcher.start()
    await this.alpha.start();
    await this.beta.start();
    await this.llama.start();
    await this.augmentor.start();
    await this.summarizer.start();
    await this.extractor.start();
    await this.validator.start();
    await this.rag.start();

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
    // if (this.discord) await this.discord.start();

    // Debug Services
    await this.rag.start();

    // Data Sources
    if (this.settings.pacer.enable) await this.pacer.start();
    if (this.settings.harvard.enable) await this.harvard.start();
    if (this.settings.courtlistener.enable) await this.courtlistener.start();

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

    try {
      const stats = await this.db('cases').count('id as count').first();
      console.debug('[JEEVES]', 'Loaded', stats.count, 'cases.');
    } catch (exception) {
      console.error('[JEEVES]', 'Could not load cases:', exception);
    }

    if (this.settings.crawl) {
      this._crawler = setInterval(async () => {
        const db = this.db;
        const unknown = await this.db('cases').where('pdf_acquired', false).where(function () {
          this.where('last_harvard_crawl', '<', db.raw('DATE_SUB(NOW(), INTERVAL 1 DAY)')).orWhereNull('last_harvard_crawl');
        }).whereNotNull('harvard_case_law_id').whereNotNull('harvard_case_law_pdf').orderBy('decision_date', 'desc').first();

        // console.debug('[INGEST] Found uningested case:', unknown.title);
        if (!unknown || !unknown.harvard_case_law_pdf) return;

        /* this.worker.addJob({
          type: 'Ingest',
          params: [
            unknown.harvard_case_law_pdf,
            `stores/harvard/${unknown.harvard_case_law_id}.pdf`,
            { id: unknown.id }
          ]
        }); */

        /* this.worker.addJob({
          type: 'ScanCourtListener',
          params: [
            { query: unknown.title }
          ]
        }); */
      }, this.settings.crawlDelay);
    }

    this._slowcrawler = setInterval(async () => {
      // Sync Health First
      const health = await this.checkHealth();
      console.debug('[JEEVES]', 'Health:', health);

      /* this.worker.addJob({ type: 'DownloadMissingRECAPDocument', params: [] }); */
      if (this.courtlistener) this.courtlistener.syncSamples();
      if (this.settings.embeddings.enable) {
        this._syncEmbeddings(SYNC_EMBEDDINGS_COUNT).then((output) => {
          console.debug('[JEEVES]', 'Embedding sync complete:', output);
        });
      }
    }, 600000); // 10 minutes

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

    this.http._addRoute('HEAD', '/cases', async (req, res) => {
      const count = await this.db('cases').count('id as count').first();
      res.set('X-Count', count.count);
      res.send();
    });

    // Search
    // TODO: test each search endpoint
    this.http._addRoute('SEARCH', '/', this._handleGenericSearchRequest.bind(this));
    this.http._addRoute('SEARCH', '/documents', ROUTES.documents.search.bind(this));
    this.http._addRoute('SEARCH', '/cases', this._handleCaseSearchRequest.bind(this));
    this.http._addRoute('SEARCH', '/conversations', this._handleConversationSearchRequest.bind(this));
    this.http._addRoute('SEARCH', '/courts', this._handleCourtSearchRequest.bind(this));
    this.http._addRoute('SEARCH', '/jurisdictions', this._handleJurisdictionSearchRequest.bind(this));
    this.http._addRoute('SEARCH', '/people', this._handlePeopleSearchRequest.bind(this));
    this.http._addRoute('SEARCH', '/reporters', ROUTES.reporters.search.bind(this));

    // Health
    this.http._addRoute('GET', '/metrics/health', this._handleHealthRequest.bind(this));

    // Files
    this.http.express.post('/files', this.uploader.single('file'), this._userMiddleware.bind(this), ROUTES.files.create.bind(this));
    // this.http._addRoute('GET', '/files/serve/:id', this._userMiddleware.bind(this), ROUTES.files.serve.bind(this));
    this.http._addRoute('GET', '/files/serve/:id', ROUTES.files.serve.bind(this));
    this.http._addRoute('GET', '/files', ROUTES.files.list.bind(this));
    this.http._addRoute('GET', '/files/:id', ROUTES.files.view.bind(this));

    // Matters
    this.http._addRoute('GET', '/matters', ROUTES.matters.list.bind(this));
    this.http._addRoute('POST', '/matters', ROUTES.matters.create.bind(this));
    this.http._addRoute('GET', '/matters/new', ROUTES.matters.new.bind(this));
    this.http._addRoute('GET', '/matters/:id', ROUTES.matters.view.bind(this));
    this.http._addRoute('GET', '/matters/conversations/new/:matterID', ROUTES.matters.newConversation.bind(this));
    this.http._addRoute('GET', '/matters/files/:id', ROUTES.matters.listFiles.bind(this));
    this.http._addRoute('GET', '/matters/notes/:id', ROUTES.matters.listNotes.bind(this));
    this.http._addRoute('GET', '/matters/:matterID/conversations', ROUTES.matters.getConversations.bind(this)); //this one gets the list of a specific Matter's conversations
    this.http._addRoute('PATCH', '/matters/context/:id', ROUTES.matters.addContext.bind(this));
    this.http._addRoute('PATCH', '/matters/:id', ROUTES.matters.edit.bind(this))
    this.http._addRoute('PATCH', '/matters/removefile/:idFile', ROUTES.matters.removeFile.bind(this));
    this.http._addRoute('PATCH', '/matters/removenote/:idNote', ROUTES.matters.removeNote.bind(this));

    // Products
    this.http._addRoute('GET', '/products', ROUTES.products.list.bind(this));

    // Jurisdictions
    this.http._addRoute('GET', '/jurisdictions/:id', ROUTES.jurisdictions.view.bind(this));

    // Jurisdictions
    this.http._addRoute('GET', '/courts/:id', ROUTES.courts.view.bind(this));

    // Statutes
    this.http._addRoute('GET', '/statutes', ROUTES.statutes.list.bind(this));

    // Users
    this.http._addRoute('GET', '/users', ROUTES.users.list.bind(this));
    this.http._addRoute('GET', '/users/:username', ROUTES.users.view.bind(this));
    // TODO: switch to PATCH `/users/:username`
    this.http._addRoute('PATCH', '/users/username', ROUTES.users.editUsername.bind(this)); //this one is for admin to change other user's username
    this.http._addRoute('PATCH', '/users/email', ROUTES.users.editEmail.bind(this)); //this one is for admin to change other user's email

    // Services
    this.http._addRoute('POST', '/services/feedback', this._handleFeedbackRequest.bind(this));

    // Feedback
    this.http._addRoute('POST', '/feedback', ROUTES.feedback.create.bind(this));

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
    this.http._addRoute('POST', '/invitations', async (req, res) => {
      const { email } = req.body;

      try {
        const user = await this.db.select('is_admin').from('users').where({ id: req.user.id }).first();
        if (!user || user.is_admin !== 1) {
          return res.status(401).json({ message: 'User not allowed to send Invitations.' });
        }

        // Generate a unique token
        let uniqueTokenFound = false;
        let invitationToken = '';

        while (!uniqueTokenFound) {
          invitationToken = crypto.randomBytes(20).toString('hex');
          const tokenExists = await this.db.select('*').from('invitations').where({ token: invitationToken }).first();
          if (!tokenExists) {
            uniqueTokenFound = true;
          }
        };

        //Flag for Eric
        //We have to change the acceptInvitationLink and the declineInvitationLink when it goes to the server so it redirects to the right hostname
        //We have to upload the image somwhere so it can be open in the email browser, right now its in a firebasestoreage i use to test
        const acceptInvitationLink = `${this.authority}/signup/${invitationToken}`;
        const declineInvitationLink = `${this.authority}/signup/decline/${invitationToken}`;
        // TODO: serve from assets (@nplayer89)
        const imgSrc = "https://firebasestorage.googleapis.com/v0/b/imagen-beae6.appspot.com/o/novo-logo-.png?alt=media&token=7ee367b3-6f3d-4a06-afa2-6ef4a14b321b";
        const htmlContent = this.createInvitationEmailContent(acceptInvitationLink, declineInvitationLink, imgSrc);

        await this.email.send({
          from: 'agent@trynovo.com',
          to: email,
          subject: 'Invitation to join Novo',
          html: htmlContent
        });

        const existingInvite = await this.db.select('*').from('invitations').where({ target: email }).first();
        if (!existingInvite) {
          const invitation = await this.db('invitations').insert({
            sender_id: req.user.id,
            target: email,
            token: invitationToken
          });

          // update the inquiry status to invited from the waitlist
          const inquiryInvitedStatus = await this.db('inquiries')
            .where({ email: email })
            .update({
              updated_at: new Date(),
              status: 'invited',
            });
          if (!inquiryInvitedStatus) {
            return res.status(500).json({ message: 'Error updating the inquiry.' });
          }
        } else {
          return res.status(500).json({ message: 'Error: Invitation already exist.' });
        }
        res.send({
          message: 'Invitation created successfully!'
        });
      } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Error sending invitation.' });
      }
    });

    //this endponint resends invitations to the ones created before
    this.http._addRoute('PATCH', '/invitations/:id', async (req, res) => {
      try {
        const user = await this.db.select('is_admin').from('users').where({ id: req.user.id }).first();
        if (!user || user.is_admin !== 1) {
          return res.status(401).json({ message: 'User not allowed to send Invitations.' });
        }

        // Generate a unique token
        let uniqueTokenFound = false;
        let invitationToken = '';
        while (!uniqueTokenFound) {
          invitationToken = crypto.randomBytes(20).toString('hex');
          const tokenExists = await this.db.select('*').from('invitations').where({ token: invitationToken }).first();
          if (!tokenExists) {
            uniqueTokenFound = true;
          }
        };

        const invitation = await this.db.select('target').from('invitations').where({ id: req.params.id }).first();
        const acceptInvitationLink = `${this.authority}/signup/${invitationToken}`;
        const declineInvitationLink = `${this.authority}/signup/decline/${invitationToken}`;
        const imgSrc = "https://firebasestorage.googleapis.com/v0/b/imagen-beae6.appspot.com/o/novo-logo-.png?alt=media&token=7ee367b3-6f3d-4a06-afa2-6ef4a14b321b";

        const htmlContent = this.createInvitationEmailContent(acceptInvitationLink, declineInvitationLink, imgSrc);
        await this.email.send({
          from: 'agent@trynovo.com',
          to: invitation.target,
          subject: 'Invitation to join Novo',
          html: htmlContent
        });

        const updateResult = await this.db('invitations')
          .where({ id: req.params.id })
          .increment('invitation_count', 1)
          .update({
            updated_at: new Date(),
            sender_id: req.user.id,
            token: invitationToken
          });

        if (!updateResult) {
          return res.status(500).json({ message: 'Error updating the invitation count.' });
        }

        res.send({
          message: 'Invitation re-sent successfully!'
        });
      } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ message: 'Error sending invitation.' });
      }
    });


    this.http._addRoute('GET', '/invitations/:id', async (req, res) => {
      // TODO: render page for accepting invitation
      // - create user account
      // - set user password
      // - create help conversation
    });

    this.http._addRoute('GET', '/invitations', async (req, res) => {
      try {
        const invitations = await this.db('invitations')
        .join('users', 'invitations.sender_id', '=', 'users.id')
        .select('invitations.*', 'users.username as sender_username')
        .orderBy('invitations.created_at', 'desc');

        res.send(invitations);
      } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ message: 'Internal server error.' });
      }
    });

    this.http._addRoute('POST', '/checkInvitationToken/:id', async (req, res) => {
      const  invitationToken = req.params.id;

      try {
        const invitation = await this.db.select('*').from('invitations').where({ token: invitationToken }).first();

        if (!invitation) {
          return res.status(404).json({ message: 'Yor invitation link is not valid.' });
        }

        // Check if the invitation has already been accepted or declined
        if (invitation.status === 'accepted') {
          return res.status(409).json({
            message: 'This invitation has already been accepted. If you believe this is an error or if you need further assistance, please do not hesitate to contact our support team at support@novo.com.'
          });
        } else if (invitation.status === 'declined') {
          return res.status(409).json({
            message: 'You have previously declined this invitation. If this was not your intention, or if you have any questions, please feel free to reach out to our support team at support@novo.com for assistance.'
          });
        }

        // Check if the token is older than 30 days
        const tokenAgeInDays = (new Date() - new Date(invitation.updated_at)) / (1000 * 60 * 60 * 24);
        if (tokenAgeInDays > 30) {
          return res.status(410).json({ message: 'Your invitation link has expired.' });
        }

        res.json({ message: 'Invitation token is valid and pending.', invitation });
      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }

    });

    //endpoint to change the status of an invitation when its accepted
    this.http._addRoute('PATCH', '/invitations/accept/:id', async (req, res) => {
      const invitationToken = req.params.id;
      try {
        const invitation = await this.db.select('*').from('invitations').where({ token: invitationToken }).first();

        if (!invitation) {
          return res.status(404).json({ message: 'Invalid invitation token' });
        }

        const updateResult = await this.db('invitations')
          .where({ token: invitationToken })
          .update({
            updated_at: new Date(),
            status: 'accepted',
          });

        if (!updateResult) {
          return res.status(500).json({ message: 'Error updating the invitation status.' });
        }

        res.send({
          message: 'Invitation accepted successfully!'
        });

      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }

    });

    //endpoint to change the status of an invitation when its declined
    this.http._addRoute('PATCH', '/invitations/decline/:id', async (req, res) => {
      const invitationToken = req.params.id;
      try {
        const invitation = await this.db.select('*').from('invitations').where({ token: invitationToken }).first();

        if (!invitation) {
          return res.status(404).json({ message: 'Invalid invitation token' });
        }

        const updateResult = await this.db('invitations')
          .where({ token: invitationToken })
          .update({
            updated_at: new Date(),
            status: 'declined',
          });

        if (!updateResult) {
          return res.status(500).json({ message: 'Error updating the invitation status.' });
        }

        res.send({
          message: 'Invitation declined successfully!'
        });

      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }

    });

    //endpoint to delete invitation from admin panel
    this.http._addRoute('PATCH', '/invitations/delete/:id', async (req, res) => {
      const invitationID = req.params.id;
      try {
        const invitation = await this.db.select('*').from('invitations').where({ id: invitationID }).first();

        if (!invitation) {
          return res.status(404).json({ message: 'Invalid invitation' });
        }

        // update the invitation status to deleted from the invitations list
        const invitationDeleteStatus = await this.db('invitations')
          .where({ id: invitationID })
          .update({
            updated_at: new Date(),
            status: 'deleted',
          });

        if (!invitationDeleteStatus) {
          return res.status(500).json({ message: 'Error deleting the invitation.' });
        }

        res.send({
          message: 'Invitation deleted successfully!'
        });

      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }

    });

    this.http._addRoute('GET', '/dockets', async (req, res) => {
      const dockets = await this.courtlistener.paginateDockets();
      res.send(dockets);
    });

    this.http._addRoute('GET', '/services/courtlistener/recapdocuments', async (req, res) => {
      const documents = await this.courtlistener.paginateRecapDocuments();
      res.send(documents);
    });

    this.http._addRoute('POST', '/users', async (req, res) => {
      const { username, password } = req.body;

      // Check if the username and password are provided
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
      }

      try {
        // Check if the username already exists
        const existingUser = await this.db('users').where('username', username).first();
        if (existingUser) {
          return res.status(409).json({ message: 'Username already exists.' });
        }

        // Generate a salt and hash the password
        const saltRounds = 10;
        const salt = genSaltSync(saltRounds);
        const hashedPassword = hashSync(password, salt);

        // Insert the new user into the database
        const newUser = await this.db('users').insert({
          username: username,
          password: hashedPassword,
          salt: salt
        });
        console.log('New user registered:', username);

        return res.json({ message: 'User registered successfully.' });
      } catch (error) {
        console.error('Error registering user: ', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    this.http._addRoute('POST', '/users/full', async (req, res) => {
      const { username, password, email, firstName, lastName, firmName, firmSize } = req.body;

      // Check if the username and password are provided
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
      }

      try {
        // Check if the username already exists
        const existingUser = await this.db('users').where('username', username).first();
        if (existingUser) {
          return res.status(409).json({ message: 'Username already exists.' });
        }

        // Check if the email already exists
        const existingEmail = await this.db('users').where('email', email).first();
        if (existingUser) {
          return res.status(409).json({ message: 'Email already registered.' });
        }

        // Generate a salt and hash the password
        const saltRounds = 10;
        const salt = genSaltSync(saltRounds);
        const hashedPassword = hashSync(password, salt);

        // Insert the new user into the database
        const newUser = await this.db('users').insert({
          username: username,
          password: hashedPassword,
          salt: salt,
          email: email,
          first_name: firstName,
          last_name: lastName,
          firm_name: firmName,
          firm_size: firmSize,
          firm_name: firmName ? firmName : null,
          firm_size: firmSize || firmSize === 0 ? firmSize : null,
        });

        console.log('New user registered:', username);

        return res.json({ message: 'User registered successfully.' });
      } catch (error) {
        console.error('Error registering user: ', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    //endpoint to check if the username is available
    this.http._addRoute('POST', '/users/:id', async (req, res) => {
      const  username = req.params.id;

      try {
        const user = await this.db.select('*').from('users').where({ username: username }).first();

        if (user) {
          return res.status(409).json({ message: 'Username already exists. Please choose a different username.' });
        }
        res.json({ message: 'Username avaliable' });

      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }

    });


    //endpoint to check if the email is available
    this.http._addRoute('POST', '/users/email/:id', async (req, res) => {
      const  email = req.params.id;

      try {
        const user = await this.db.select('*').from('users').where({ email: email }).first();

        if (user) {
          return res.status(409).json({ message: 'Email already registered. Please choose a different username.' });
        }
        res.json({ message: 'Email avaliable' });

      } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
      }
    });

    this.http._addRoute('GET', '/sessions', async (req, res, next) => {
      return res.send(this.http.app.render());
    });

    // TODO: change to /sessions
    this.http._addRoute('GET', '/sessions/new', async (req, res, next) => {
      return res.redirect('/sessions');
    });

    this.http._addRoute('GET', '/passwordreset/:token', async (req, res, next) => {
      return res.send(this.http.app.render());
    });

    this.http._addRoute('POST', '/sessions', ROUTES.sessions.create.bind(this));

    // TODO: change this route from `/sessionRestore` to use authMiddleware?
    this.http._addRoute('GET', '/sessionRestore', async (req, res, next) => {
      try {
        const user = await this.db('users').where('id', req.user.id).first();
        if (!user) {
          return res.status(401).json({ message: 'Invalid session.' });
        }
        return res.json({
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin,
          isBeta: user.is_beta,
          isCompliant: user.is_compliant
        });
      } catch (error) {
        console.error('Error authenticating user: ', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    this.http._addRoute('POST', '/passwordChange', async (req, res, next) => {
      const { oldPassword, newPassword } = req.body;

      try {
        const user = await this.db('users').where('id', req.user.id).first();
        if (!user || !compareSync(oldPassword, user.password)) {
          return res.status(401).json({ message: 'Invalid password.' });
        }

        // Generate a salt and hash the new password
        const saltRounds = 10;
        const salt = genSaltSync(saltRounds);
        const hashedPassword = hashSync(newPassword, salt);

        // Update the user's password in the database
        await this.db('users').where('id', user.id).update({
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

    this.http._addRoute('POST', '/usernameChange', async (req, res, next) => {
      const { newUsername, password } = req.body;

      try {
        const user = await this.db('users').where('id', req.user.id).first();
        //check for the password
        if (!user || !compareSync(password, user.password)) {
          return res.status(401).json({ message: 'Invalid password.' });
        }

        // Check if the username already exists
        const existingUser = await this.db('users').where('username', newUsername).first();
        if (existingUser) {
          return res.status(409).json({ message: 'Username already exists.' });
        }

        // Update the user's username in the database
        await this.db('users').where('id', user.id).update({
          username: newUsername,
        });

        return res.json({
          message: 'Username updated successfully.',
        });
      } catch (error) {
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    //this is the function that generates a password reset token
    this.http._addRoute('POST', '/passwordReset', async (req, res, next) => {
      const { email } = req.body;

      try {
        // Check if the email exists
        const existingUser = await this.db('users').where('email', email).first();
        if (!existingUser) {
          return res.status(409).json({
            message: 'This email you entered is not assigned to a registered user. Please check and try again or contact client services on support@novo.com '
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
        const imgSrc = "https://firebasestorage.googleapis.com/v0/b/imagen-beae6.appspot.com/o/novo-logo-.png?alt=media&token=7ee367b3-6f3d-4a06-afa2-6ef4a14b321b";

        const htmlContent =this.createPasswordResetEmailContent(resetLink,imgSrc);

        try {
          await this.email.send({
            from: 'agent@trynovo.com',
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
            message: 'Email could not be sent. Please try again later or contact client services on support@novo.com.'
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

    //route to edit a conversation title
    this.http._addRoute('PATCH', '/conversations/:id', async (req, res, next) => {
      const { title } = req.body;

      try {
        const conversationEditing = await this.db('conversations')
        .where({
          id: req.params.id,
          creator_id: req.user.id  // validates if the user editing is the creator of the conversation
        }).first();

        if (!conversationEditing) {
          return res.status(401).json({ message: 'Invalid conversation.' });
        }

        // Update the conversation's title in the database
        await this.db('conversations').where('id', req.params.id).update({
          title: title
        });

        return res.json({
          message: 'Title edited successfully.',
        });
      } catch (error) {
        console.error('Error editing title: ', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    this.http._addRoute('GET', '/statistics', async (req, res, next) => {
      const inquiries = await this.db('inquiries').select('id');
      const invitations = await this.db('invitations').select('id').from('invitations');
      const uningested = await this.db('cases').select('id').where('pdf_acquired', false).whereNotNull('harvard_case_law_id').orderBy('decision_date', 'desc');
      const ingestions = fs.readdirSync('./stores/harvard').filter((x) => x.endsWith('.pdf'));
      const stats = {
        ingestions: {
          remaining: uningested.length,
          complete: ingestions.length
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

    this.http._addRoute('GET', '/cases', ROUTES.cases.list.bind(this));
    this.http._addRoute('GET', '/cases/:id', async (req, res, next) => {
      const origin = {};
      const updates = {};
      const instance = await this.db.select('id', 'title', 'short_name', 'created_at', 'decision_date', 'summary', 'harvard_case_law_id', 'harvard_case_law_pdf', 'harvard_case_law_court_name as court_name', 'harvard_case_law_court_name', 'courtlistener_id', 'pacer_case_id').from('cases').where({
        id: req.params.id
      }).first();

      if (!instance) return res.status(404).json({ message: 'Case not found.' });
      // if (!instance.courtlistener_id) return res.status(404).json({ message: 'Case not found.' });

      this.secureEmbeddingsForCase(instance.id).then((output) => {
        console.debug('Secure embeddings for case:', output);
      }).catch((exception) => {
        console.debug('Secure embeddings error:', exception);
      });

      if (this.settings.courtlistener.enable) {
        this.courtlistener.search({ query: instance.title }).then((clr) => {
          console.debug('[NOVO]', '[COURTLISTENER]', '[SEARCH]', 'Jeeves got results:', clr);
        });
      }

      const canonicalTitle = `${instance.title} (${instance.decision_date}, ${instance.harvard_case_law_court_name})`;

      // Async Tasks
      // Embeddings
      /* const embeddedTitle = await */ this._generateEmbedding(instance.title);
      /* const embeddedKey = await */ this._generateEmbedding(canonicalTitle);

      // Data Updates
      if (instance.courtlistener_id) {
        const record = await this.courtlistener.db('search_docket').where({ id: instance.courtlistener_id }).first();
        console.debug('[NOVO]', '[CASE:VIEW]', '[COURTLISTENER]', 'docket record:', record);
        const title = record.case_name_full || record.case_name || instance.title;
        if (title !== instance.title) updates.title = title;
      }

      if (instance.pacer_case_id) {
        const record = await this.courtlistener.db('search_docket').where({ pacer_case_id: instance.pacer_case_id }).first();
        console.debug('[NOVO]', '[CASE:VIEW]', 'PACER record:', record);
        const title = record.case_name_full || record.case_name || instance.title;
        if (title !== instance.title) updates.title = title;
      }

      if (instance.harvard_case_law_id) {
        console.debug('[NOVO]', '[CASE:VIEW]', '[HARVARD]', 'Harvard record:', instance.harvard_case_law_id);
        fetch(`https://api.case.law/v1/cases/${instance.harvard_case_law_id}`, {
          // TODO: additional params (auth?)
        }).catch((exception) => {
          console.error('[NOVO]', '[CASE:VIEW]', 'FETCH FULL CASE ERROR:', exception);
        }).then(async (output) => {
          const target = await output.json();
          console.debug('[NOVO]', '[CASE:VIEW]', '[HARVARD]', '[FULLCASE]', 'Got output:', target);
          const message = Message.fromVector(['HarvardCase', JSON.stringify(target)]);
          this.http.broadcast(message);
        });
      }

      // Search Test
      if (!instance.title) {
        console.error('[JEEVES]', '[SEARCH]', 'Case has no title:', instance);
      } else {
        console.debug('[JEEVES]', '[SEARCH]', 'Searching for case backfill:', instance.title);
        this.search({
          query: instance.title
        }).then((results) => {
          console.debug('[JEEVES]', '[SEARCH]', 'Jeeves search results:', results);
          const message = Message.fromVector(['SearchResults', JSON.stringify(results)]);
          this.http.broadcast(message);

          if (results.cases && results.cases.length > 0) {
            const first = results.cases[0];
          }
        });
      }

      if (!instance.summary) {
        const merged = Object.assign({}, instance, updates);
        this._summarizeCaseToLength(merged).then(async (summary) => {
          if (summary) updates.summary = summary;
          if (Object.keys(updates).length > 0) {
            console.debug('[NOVO]', '[CASE:VIEW]', 'UPDATING CASE:', updates, instance);
            this.db('cases').update(updates).where('id', instance.id);
          }
        });
      }

      res.format({
        json: async () => {
          res.send(instance);
        },
        html: () => {
          // TODO: provide state
          // const page = new CaseView({});
          // TODO: fix this hack
          // const page = new CaseHome({}); // TODO: use CaseView
          // const html = page.toHTML();
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/cases/:id/pdf', async (req, res, next) => {
      const instance = await this.db.select('id', 'harvard_case_law_pdf').from('cases').where({ id: req.params.id, pdf_acquired: true }).first();
      if (!instance || !instance.harvard_case_law_pdf) res.end(404);
      /* const pdf = fs.readFileSync(`./stores/harvard/${instance.harvard_case_law_id}.pdf`);
      res.send(pdf); */
      res.redirect(instance.harvard_case_law_pdf);
    });

    this.http._addRoute('GET', '/conversations', async (req, res, next) => {
      res.format({
        json: async () => {
          let results = [];

          // TODO: re-evaluate security of `is_admin` check
          if (req.user?.state?.roles?.includes('admin')) {
            results = await this.db.select('c.id', 'c.title', 'c.created_at', 'username as creator_name','matter_id').from('conversations as c').orderBy('created_at', 'desc').join('users', 'c.creator_id', '=', 'users.id');
          } else {
            results = await this.db.select('id', 'title', 'created_at').from('conversations').where({ creator_id: req.user.id }).orderBy('created_at', 'desc');
            // TODO: update the conversation upon change (new user message, new agent message)
            // TODO: sort conversations by updated_at (below line)
            // const conversations = await this.db.select('id', 'title', 'created_at').from('conversations').orderBy('updated_at', 'desc');
          }

          res.send(results);
        },
        html: () => {
          // TODO: provide state
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/courts', ROUTES.courts.list.bind(this));
    this.http._addRoute('GET', '/courts/:slug', async (req, res, next) => {
      const court = await this.db.select('id', 'fabric_id', 'slug', 'name', 'short_name', 'founded_date', 'courtlistener_id', 'pacer_id', 'start_date', 'end_date').from('courts').where({ slug: req.params.slug }).first();
      res.format({
        json: () => {
          if (!court) return res.status(404).json({ message: 'Court not found.' });
          res.send(court);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/people', async (req, res, next) => {
      const page = req.query.page || 1;
      const people = await this.db.select(
        'id as dbid',
        'fabric_id as id',
        'full_name',
        'name_first',
        'name_middle',
        'name_last',
        'name_suffix',
        'date_of_birth',
        'date_of_death',
        'birth_city',
        'birth_state',
        'courtlistener_id'
      ).whereNotNull('fabric_id').from('people').orderBy('full_name', 'asc').paginate({
        perPage: PER_PAGE_LIMIT,
        currentPage: page
      });

      res.setHeader('X-Fabric-Type', 'Collection');
      res.setHeader('X-Pagination', true);
      res.setHeader('X-Pagination-Current', `${people.pagination.from}-${people.pagination.to}`);
      res.setHeader('X-Pagination-Per', people.pagination.perPage);
      res.setHeader('X-Pagination-Total', people.pagination.total);

      res.format({
        json: () => {
          res.send(people.data);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      })
    });

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

    this.http._addRoute('GET', '/documents', async (req, res, next) => {
      const currentPage = req.query.page || 1;
      const documents = await this.db('documents').select('id', 'sha1', 'sha256', 'description', 'created_at', 'fabric_id', 'html', 'content').whereNotNull('fabric_id').orderBy('created_at', 'desc').paginate({
        perPage: PER_PAGE_LIMIT,
        currentPage: currentPage
      });

      res.format({
        json: () => {
          // Create response
          const response = (documents && documents.data && documents.data.length) ? documents.data.map((doc) => {
            return {
              id: doc.fabric_id,
              created: doc.created_at,
              description: doc.description,
              sha1: doc.sha1,
              sha256: doc.sha256,
              size: doc.file_size
            };
          }) : [];

          // Set Pagination Headers
          res.setHeader('X-Pagination', true);
          res.setHeader('X-Pagination-Current', `${documents.pagination.from}-${documents.pagination.to}`);
          res.setHeader('X-Pagination-Per', documents.pagination.perPage);
          res.setHeader('X-Pagination-Total', documents.pagination.total);

          return res.send(response);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/documents/:fabricID', async (req, res, next) => {
      const document = await this.db('documents').select('id', 'description', 'created_at', 'fabric_id', ).where('fabric_id', req.params.fabricID).first();
      res.format({
        json: () => {
          return res.send(document);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/opinions', async (req, res, next) => {
      const opinions = await this.db.select('id', 'date_filed', 'summary').from('opinions').orderBy('date_filed', 'desc');

      res.format({
        json: () => {
          res.send(opinions);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      })
    });

    this.http._addRoute('GET', '/judges', async (req, res, next) => {
      const judges = await this.db.select('id').from('judges').orderBy('name', 'asc');
      res.format({
        json: () => {
          res.send(judges);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/jurisdictions', async (req, res, next) => {
      const jurisdictions = await this.db.select('id','name','name_short','harvard_id').from('jurisdictions').orderBy('id', 'desc');
      res.format({
        json: () => {
          res.send(jurisdictions);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/reporters', async (req, res, next) => {
      const reporters = await this.db.select('*').from('reporters').orderBy('id', 'desc');
      res.format({
        json: () => {
          res.send(reporters);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/volumes', async (req, res, next) => {
      const volumes = await this.db.select('id').from('volumes').orderBy('id', 'desc');
      res.format({
        json: () => {
          res.send(volumes);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    });

    this.http._addRoute('GET', '/messages', async (req, res, next) => {
      let messages = [];

      if (req.query.conversation_id) {
        messages = await this.db('messages').join('users', 'messages.user_id', '=', 'users.id').select('users.username', 'messages.id', 'messages.user_id', 'messages.created_at', 'messages.updated_at', 'messages.content', 'messages.status', 'messages.cards').where({
          conversation_id: req.query.conversation_id
        }).orderBy('created_at', 'asc');
      } else {
        // messages = await this.db.select('id', 'created_at', 'content').from('messages').orderBy('created_at', 'asc');
      }

      messages = messages.map((m) => {
        return { ...m, author: m.username || 'User #' + m.user_id, role: (m.user_id == 1) ? 'assistant' : 'user' };
      });

      res.send(messages);
    });

    this.http._addRoute('GET', '/conversations/:id', async (req, res, next) => {
      const conversation = await this.db.select('id', 'title', 'created_at', 'log').from('conversations').where({ id: req.params.id }).first();
      const messages = await this.db('messages')
        .whereIn('id', conversation.log)
        .select('id', 'content', 'created_at');

      conversation.messages = messages;

      res.format({
        json: () => {
          res.send(conversation);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    });

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
          case 'courtlistener':
            if (this.courtlistener) source.counts = await this.courtlistener.getCounts();
            break;
          case 'harvard':
            if (this.harvard) source.counts = await this.harvard.getCounts();
            break;
          case 'pacer':
            if (this.pacer) source.counts = await this.pacer.getCounts();
            break;
          default:
            console.warn('[JEEVES]', 'Unhandled Datasource:', name);
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

    this.http._addRoute('POST', '/messages', async (req, res, next) => {
      console.debug('[JEEVES]', '[HTTP]', 'Handling inbound message:', req.body);

      let isNew = false;
      let subject = null;
      let {
        case_id,
        conversation_id,
        content,
        matter_id
      } = req.body;

      if (!conversation_id) {
        isNew = true;

        const now = new Date();
        const name = `Conversation Started ${now.toISOString()}`;
        /* const room = await this.matrix.client.createRoom({ name: name }); */
        const created = await this.db('conversations').insert({
          creator_id: req.user.id,
          log: JSON.stringify([]),
          title: name,
          matter_id: matter_id,
          // matrix_room_id: room.room_id
        });

        // TODO: document why array only for Postgres
        // all others return the numeric id (Postgres returns an array with a numeric element)
        conversation_id = created[0];
      }

      if (case_id) {
        try {
          subject = await this.db('cases').select('id', 'title', 'harvard_case_law_court_name as court_name', 'decision_date').where('id', case_id).first();
        } catch (exception) {
          this.emit('warning', `Could not find case ID: ${case_id}`);
        }
      }

      try {
        const conversation = await this.db('conversations').where({ id: conversation_id }).first();
        if (!conversation) throw new Error(`No such Conversation: ${conversation_id}`);

        // User Message
        const newMessage = await this.db('messages').insert({
          content: content,
          conversation_id: conversation_id,
          user_id: req.user.id
        });

        // Core Pipeline
        this.createTimedRequest({
          conversation_id: conversation_id,
          matter_id: matter_id,
          query: content
        }).catch((exception) => {
          console.error('[JEEVES]', '[HTTP]', 'Error creating timed request:', exception);
        }).then(async (request) => {
          console.debug('[JEEVES]', '[HTTP]', 'Created timed request:', request);
          // TODO: emit message

          if (!request || !request.content) {
            console.debug('[JEEVES]', '[HTTP]', 'No request content:', request);
            return;
          }

          // Card Extraction
          this.extractor.query({
            query: `$CONTENT\n\`\`\`\n${request.content}\n\`\`\``
          }).then(async (extracted) => {
            console.debug('[JEEVES]', '[HTTP]', 'Got extractor output:', extracted.content);
            if (extracted && extracted.content) {
              try {
                const caseCards = JSON.parse(extracted.content).map((x) => {
                  const actor = new Actor({ name: x });
                  return {
                    type: 'CaseCard',
                    content: { id: actor.id }
                  };
                });

                const updated = await this.db('messages').where({ id: newMessage[0] }).update({
                  cards: JSON.stringify(caseCards.map((x) => x.content.id))
                });
              } catch (exception) {
                console.error('[JEEVES]', '[HTTP]', '[MESSAGE]', 'Error updating cards:', exception);
              }
            }
          });

          if (isNew) {
            const messages = await this._getConversationMessages(conversation_id);
            this._summarizeMessagesToTitle(messages.map((x) => {
              return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
            })).then(async (output) => {
              console.debug('[JEEVES]', '[HTTP]', 'Got title output:', output);
              let title = output?.content || 'broken content title';
              if (title && title.length > 100) title = title.split(/\s+/)[0].slice(0, 100).trim();
              if (title) await this.db('conversations').update({ title }).where({ id: conversation_id });

              const conversation = { id: conversation_id, messages: messages, title: title };
              const message = Message.fromVector(['Conversation', JSON.stringify(conversation)]);

              this.http.broadcast(message);
            });
          }
        });
        // End Core Pipeline

        // pre-release pipeline
        /* const inserted = await this.db('requests').insert({
          message_id: newMessage[0],
          content: 'Jeeves is thinking...'
        });

        this._handleRequest({
          // actor: activity.actor,
          conversation_id: conversation_id,
          subject: (subject) ? `${subject.title}, ${subject.court_name}, ${subject.decision_date}` : null,
          input: content,
          // room: roomID // TODO: replace with a generic property (not specific to Matrix)
          // target: activity.target // candidate 1
        }).then(async (output) => {
          console.debug('[JEEVES]', '[HTTP]', 'Got request output:', output);
        */

          // TODO: restore response tracking
          /* this.db('responses').insert({
            // TODO: store request ID
            content: output.object.content
          }); */

          // TODO: restore titling
        /*
        }); */

        if (!conversation.log) conversation.log = [];
        if (typeof conversation.log == 'string') {
          conversation.log = JSON.parse(conversation.log);
        }

        // Attach new message to the conversation
        conversation.log.push(newMessage[0]);

        await this.db('conversations').update({
          log: JSON.stringify(conversation.log)
        }).where({
          id: conversation_id
        });

        return res.json({
          message: 'Message sent.',
          object: {
            id: newMessage[0],
            conversation: conversation_id
          }
        });
      } catch (error) {
        console.error('ERROR:', error);
        this.emit('error', `Failed to create message: ${error}`);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    // TODO: attach old message ID to a new message ID, send `regenerate_requested` to true
    this.http._addRoute('PATCH', '/messages/:id', async (req, res, next) => {
      let subject = null;
      let {
        case_id,
        conversation_id,
        content,
        messageID,
        regenerate
      } = req.body;

      if (!regenerate) console.warn('[JEEVES]', '[WARNING]', 'PATCH /messages/:id called without `regenerate` flag.  This is a destructive operation.');

      if (case_id) {
        subject = await this.db('cases').select('id', 'title', 'harvard_case_law_court_name as court_name', 'decision_date').where('id', case_id).first();
      }

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

    this.http._addRoute('SEARCH', '/services/courtlistener/people', async (req, res, next) => {
      const request = req.body;
      console.debug('[JEEVES]', '[COURTLISTENER]', '[PEOPLE]', 'searching people:', request);

      try {
        const results = await this.courtlistener.search({
          query: request.query,
          model: 'jeeves-0.2.0-RC1'
        });

        console.debug('[JEEVES]', '[COURTLISTENER]', '[PEOPLE]', 'search results:', results);

        res.json(results);
      } catch (error) {
        console.error('Error searching CourtListener:', error);
        res.status(500).json({ message: 'Internal server error.' });
      }
    });

    this.http._addRoute('SEARCH', '/services/courtlistener/dockets', async (req, res, next) => {
      if (!this.courtlistener) return res.send({ message: 'CourtListener is not available.' });
      const request = req.body;
      console.debug('[JEEVES]', '[COURTLISTENER]', '[DOCKETS]', 'searching dockets:', request);

      try {
        const results = await this.courtlistener.search({
          query: request.query,
          model: 'jeeves-0.2.0-RC1'
        });

        console.debug('[JEEVES]', '[COURTLISTENER]', '[DOCKETS]', 'search results:', results);

        res.json(results);
      } catch (error) {
        console.error('Error searching CourtListener:', error);
        res.status(500).json({ message: 'Internal server error.' });
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
    this.queue._addJob({ method: 'verify', params: [] });

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
    this.emit('log', '[JEEVES] Started!');
    this.emit('debug', `[JEEVES] Services available: ${JSON.stringify(this._listServices(), null, '  ')}`);
    this.emit('debug', `[JEEVES] Services enabled: ${JSON.stringify(this.settings.services, null, '  ')}`);

    // Emit ready event
    this.emit('ready');

    // DEBUG
    this.alert(`Jeeves started.  Agent ID: ${this.id}`);

    // Benchmarking
    if (this.settings.benchmark) {
      return this.stop();
    }

    // return the instance!
    return this;
  }

  //function that creates the template to email invitations sendig
  createInvitationEmailContent(acceptLink, declineLink, imgSrc) {
    return `
          <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                    }

                    .button {
                        background-color: #1f487c;
                        border: none;
                        color: white;
                        padding: 10px 20px;
                        text-align: center;
                        text-decoration: none;
                        display: inline-block;
                        font-size: 16px;
                        font-weight: bold;
                        margin: 4px 2px;
                        cursor: pointer;
                        border-radius: 8px;
                        width: 150px;
                    }

                    .button:hover {
                        background-color: #163d5c;
                    }

                    .decline {
                        color: #ca392f;
                        text-decoration: none;
                        font-size: 14px;
                        margin-top: 20px;
                        display: inline-block;
                    }

                    .container {
                        text-align: center;
                        max-width: 500px;
                        margin: 0 auto;
                    }

                    .footer {
                        margin-top: 30px;
                        font-size: 0.8em;
                    }
                    table {
                      width: 100%;
                  }

                  .content {
                      text-align: center;
                  }
                </style>
            </head>

            <body>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td>
                            <div class="container">
                                <table role="presentation" align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px;">
                                    <tr>
                                        <td class="content">
                                            <img src=${imgSrc} alt="Novo Logo" style="max-width: 300px; height: auto;">
                                            <h3>Hello, You have been invited to join Novo.</h3>
                                            <p>We are pleased to extend an invitation for you to join Novo, your advanced legal assistant platform. Click on the link below to register and gain access to our services.</p>
                                            <a href=${acceptLink} class="button" target="_blank" style="background-color: #1f487c; color: white; text-decoration: none;">Join Novo</a>
                                            <p>If you prefer not to receive future invitations, <a href=${declineLink} class="decline">click here</a>.</p>
                                        </td>
                                    </tr>
                                </table>
                                <div class="footer">
                                    <p>For any inquiries, feel free to contact us at <a href="mailto:support@novo.com">support@novo.com</a></p>
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </body>

          </html>`;
  }
  createPasswordResetEmailContent(resetLink, imgSrc) {
    return `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
              }

              .button {
                background-color: #1f487c;
                border: none;
                color: white;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                font-weight: bold;
                margin: 4px 2px;
                cursor: pointer;
                border-radius: 8px;
                width: 150px;
              }

              .button:hover {
                background-color: #163d5c;
              }

              .container {
                text-align: center;
                max-width: 500px;
                margin: 0 auto;
              }

              .footer {
                margin-top: 30px;
                font-size: 0.8em;
              }
            </style>
          </head>
          <body>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <div class="container">
                    <table role="presentation" align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px;">
                      <tr>
                        <td class="content">
                          <img src=${imgSrc} alt="Novo Logo" style="max-width: 300px; height: auto;">
                          <h3>Password Reset Request</h3>
                          <p>You have requested to reset your password. Please click the button below to set a new password.</p>
                          <a href=${resetLink} class="button" target="_blank" style="background-color: #1f487c; color: white; text-decoration: none;">Reset Password</a>
                          <p>If you did not request a password reset, please ignore this email.</p>
                        </td>
                      </tr>
                    </table>
                    <div class="footer">
                      <p>If you have any issues or questions, please contact us at <a href="mailto:support@novo.com">support@novo.com</a></p>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
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
    console.debug('[JEEVES]', '[SEARCH]', 'Generic search request:', request);

    this.search(request).then((results) => {
      console.debug('[JEEVES]', '[SEARCH]', 'Results:', results);

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
    console.debug('[JEEVES]', '[RAG]', 'Query:', query);
    const result = await this.fabric.search({
      query: query,
      model: 'jeeves-0.2.0-RC1'
    });

    return result;
  }

  async _handleCaseSearchRequest (req, res, next) {
    try {
      const request = req.body;
      const cases = await this._searchCases(request);
      const result = {
        cases: cases || []
      };

      return res.send({
        type: 'SearchCasesResult',
        content: result
      });
    } catch (exception) {
      res.status(503);
      return res.send({
        type: 'SearchCasesError',
        content: exception
      });
    }
  }

  async _handleConversationSearchRequest (req, res, next) {
    const request = req.body;
    console.debug('[JEEVES]', '[SEARCH]', 'Conversation search request:', request);

    this.searchConversations(request).then((results) => {
      console.debug('[JEEVES]', '[SEARCH]', 'Results:', results);

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

  async _handleCourtListenerDocument (actor) {
    if (1 || this.settings.debug) console.debug('[NOVO]', '[COURTLISTENER]', '[DOCUMENT]', 'Received document:', actor);
    const document = actor.content;
    // TODO: store sample.id as fabric_id
    const sample = new Actor({ name: `courtlistener/documents/${document.id}` });
    const target = await this.db('documents').where({ courtlistener_id: document.id }).first();

    if (!target) {
      if (1 || this.settings.debug) console.debug('DOCUMENT NOT FOUND, INSERTING:', document);
      // TODO: retrieve docket_entry_id etc.
      // populate all subsequent data

      await this.db('documents').insert({
        sha1: document.sha1,
        description: document.description,
        file_size: document.file_size,
        page_count: document.page_count,
        date_created: document.date_created,
        date_modified: document.date_modified,
        date_uploaded: document.date_upload,
        pacer_doc_id: document.pacer_doc_id,
        is_available: document.is_available,
        is_sealed: document.is_sealed,
        courtlistener_id: document.id,
        courtlistener_thumbnail: document.thumbnail,
        courtlistener_filepath_local: document.filepath_local,
        courtlistener_filepath_ia: document.filepath_ia,
        courtlistener_ocr_status: document.ocr_status,
        plain_text: document.plain_text
      });
    }
  }

  async _handleCourtSearchRequest (req, res, next) {
    try {
      const request = req.body;
      const courts = await this._searchCourts(request);
      const result = {
        courts: courts || []
      };

      return res.send({
        type: 'SearchCourtsResult',
        content: result,
        results: courts
      });
    } catch (exception) {
      res.status(503);
      return res.send({
        type: 'SearchCourtsError',
        content: exception
      });
    }
  }

  async _handleJurisdictionSearchRequest (req, res, next) {
    try {
      const request = req.body;
      const jurisdictions = await this._searchJurisdictions(request);
      const result = {
        jurisdictions: jurisdictions || []
      };

      return res.send({
        type: 'SearchJurisdictionsResult',
        content: result,
        results: jurisdictions
      });
    } catch (exception) {
      res.status(503);
      return res.send({
        type: 'SearchJurisdictionsError',
        content: exception
      });
    }
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
    console.debug('[JEEVES]', '[MATRIX]', 'Matrix activity:', activity);
    if (activity.actor == this.matrix.id) return;
    if (!activity.target) {
      console.debug('[JEEVES]', '[MATRIX]', 'No target, ignoring.');
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

  async _handleFabricCourt (court) {
    // console.debug('[FABRIC]', '[COURT]', court);
    const target = await this.db('courts').where({ fabric_id: court.id }).first();
    // console.debug('[FABRIC]', '[COURT]', '[TARGET]', target);
    if (!target) {
      const inserted = await this.db('courts').insert({
        fabric_id: court.id,
        slug: court.slug,
        courtlistener_id: court.ids?.courtlistener,
        founded_date: new Date(court.founded_date),
        name: court.name,
        short_name: court.short_name || court.name,
        citation_string: court.citation_string
      });

      // console.debug('[FABRIC]', '[COURT]', '[INSERTED]', inserted);
    }
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

  async _handleCourtListenerDocket (docket) {
    const actor = new Actor({ name: `courtlistener/dockets/${docket.id}` });
    const bestname = docket.case_name_full || docket.case_name_short || docket.case_name || docket.case_name_short;
    const court = await this.db('courts').where({ courtlistener_id: docket.court_id }).first();
    const instance = {
      fabric_id: actor.id,
      court_id: court.id,
      pacer_case_id: docket.pacer_case_id,
      courtlistener_id: docket.id,
      title: bestname,
      short_name: docket.case_name_short,
      date_filed: docket.date_filed,
      date_argued: docket.date_argued,
      date_reargued: docket.date_reargued,
      date_reargument_denied: docket.date_reargument_denied,
      date_blocked: docket.date_blocked,
      date_last_filing: docket.date_last_filing,
      date_terminated: docket.date_terminated
    };

    // console.debug('[JEEVES]', '[COURTLISTENER]', 'Docket:', docket);
    const target = await this.db('cases').where({ fabric_id: actor.id }).first();
    // console.debug('[NOVO]', '[COURTLISTENER]', 'Docket Target Case:', target);

    if (docket.pacer_case_id) {
      if (this.settings.debug) console.debug('[JEEVES]', '[COURTLISTENER]', 'We have a PACER Case ID:', docket.pacer_case_id);
      const pacer = await this.db('cases').where({ pacer_case_id: docket.pacer_case_id }).first();
      if (!pacer) {
        if (this.settings.debug) console.debug('[JEEVES]', '[COURTLISTENER]', 'No PACER case found, inserting:', instance);

        if (instance.court_id) {
          if (this.settings.debug) console.debug('[JEEVES]', '[COURTLISTENER]', 'Court ID for PACER case:', instance.court_id);
          const court = await this.db('courts').where({ courtlistener_id: instance.court_id }).first();
          console.debug('[JEEVES]', '[COURTLISTENER]', 'Court for PACER case:', court);
          if (!court) {
            console.debug('[JEEVES]', '[COURTLISTENER]', 'No court found, searching:', instance.court_id);

            try {
              const sample = await this.courtlistener.db('search_court').where({ id: instance.court_id }).first();
              const matches = await this.courtlistener.db('search_court').where({ id: instance.court_id });
              console.debug('[JEEVES]', '[COURTLISTENER]', 'Sample court:', sample);
              console.debug('[JEEVES]', '[COURTLISTENER]', 'Matches:', matches);
            } catch (exception) {
              console.error('[JEEVES]', '[COURTLISTENER]', 'Failed to search for court:', exception);
            }
          }
        }
      }
    }

    if (!target) {
      try {
        // await this.db('cases').insert(instance);
      } catch (exception) {
        console.error('[JEEVES]', '[COURTLISTENER]', 'Failed to insert case:', exception);
        console.error('[JEEVES]', '[COURTLISTENER]', 'Target was:', target);
        console.error('[JEEVES]', '[COURTLISTENER]', 'Fabric ID was:', actor.id);
      }
    }
  }

  async _handleHarvardError (error) {
    console.error('[JEEVES]', '[HARVARD]', '[ERROR]', error);
  }

  async _handleHarvardDebug (...params) {
    console.debug('[JEEVES]', '[HARVARD]', '[DEBUG]', ...params);
  }

  async _handleHarvardWarning (warning) {
    console.warn('[JEEVES]', '[HARVARD]', '[WARNING]', warning);
  }

  async _handleHarvardSync (sync) {
    console.debug('[JEEVES]', '[HARVARD]', 'sync:', sync);
  }

  async _handleHarvardDocument (document) {
    console.debug('[JEEVES]', '[HARVARD]', 'document:', document);
  }

  async _handleHarvardCourt (court) {
    console.debug('[JEEVES]', '[HARVARD]', 'court:', court);
    const actor = new Actor({ name: `harvard/courts/${court.id}` });
    const target = await this.db('courts').where({ harvard_id: court.id }).first();

    // Attach to Jurisdiction
    let jurisdiction = await this.db('jurisdictions').where({ name_short: court.jurisdiction }).first();
    // const remote = await this.harvard.syncCourtBySlug(court.slug);
    if (!jurisdiction) {
      console.debug('no jurisdiction:', court.jurisdiction);
      const remote = await this.harvard.syncCourtBySlug(court.slug);
      console.debug('got remote:', remote);
    }

    if (!target) {
      await this.db('courts').insert({
        fabric_id: actor.id,
        harvard_id: court.id,
        name: court.name || court.name_abbreviation,
        short_name: court.name_abbreviation,
        jurisdiction: court.jurisdiction,
        jurisdiction_id: jurisdiction.id || null,
        slug: court.slug
      });
    }

    if (target.jurisdiction_id !== jurisdiction.id) {
      await this.db('courts').where({ id: target.id }).update({ jurisdiction_id: jurisdiction.id });
    }

    /* if (court.name) {
      const search = await this._searchCourtsByTerm(court.name);
      console.debug('[JEEVES]', '[HARVARD]', 'Search Results:', search);
    } */
  }

  async _handleHarvardJurisdiction (jurisdiction) {
    if (this.settings.debug) console.debug('[JEEVES]', '[HARVARD]', 'jurisdiction:', jurisdiction);
    const actor = new Actor({ name: `harvard/jurisdictions/${jurisdiction.id}` });
    const target = await this.db('jurisdictions').where({ harvard_id: jurisdiction.id }).first();

    if (!target) {
      await this.db('jurisdictions').insert({
        fabric_id: actor.id,
        harvard_id: jurisdiction.id,
        name: jurisdiction.name_long,
        name_short: jurisdiction.name
      });
    }
  }

  async _handleHarvardReporter (reporter) {
    if (this.settings.debug) console.debug('[JEEVES]', '[HARVARD]', 'reporter:', reporter);
    const actor = new Actor({ name: `harvard/reporters/${reporter.id}` });
    const target = await this.db('reporters').where({ harvard_id: reporter.id }).first();

    if (!target) {
      await this.db('reporters').insert({
        fabric_id: actor.id,
        harvard_id: reporter.id,
        name: reporter.full_name,
        name_short: reporter.short_name,
        start_year: reporter.start_year,
        end_year: reporter.end_year,
        // jurisdiction: reporter.jurisdiction,
        // slug: reporter.slug
      });
    }

    const jurisdictions = await Promise.all(reporter.jurisdictions.map((jurisdiction) => {
      return this.db('jurisdictions').where({ harvard_id: jurisdiction.id }).first();
    }));

    for (let i = 0; i < jurisdictions.length; i++) {
      const link = await this.db('reporter_jurisdictions').where({ reporter_id: target.id, jurisdiction_id: jurisdictions[i].id }).first();
      if (link) continue;
      await this.db('reporter_jurisdictions').insert({
        reporter_id: target.id,
        jurisdiction_id: jurisdictions[i].id
      });
    }
  }

  async _handleHarvardVolume (volume) {
    console.debug('[JEEVES]', '[HARVARD]', 'volume:', volume);
    const actor = new Actor({ name: `harvard/volumes/${volume.id}` });
    this.db('volumes').where({ harvard_id: volume.id }).first().then(async (target) => {
      console.debug('[JEEVES]', '[HARVARD]', 'Found volume:', target);

      if (!target) {
        await this.db('volumes').insert({
          fabric_id: actor.id,
          harvard_id: volume.id,
          title: volume.title,
          start_year: volume.start_year,
          end_year: volume.end_year,
          harvard_pdf_url: volume.pdf_url
        });
      }
    }).catch((exception) => {
      console.error('[JEEVES]', '[HARVARD]', 'Failed to find volume:', exception);
    });
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
    const messages = await this.db('messages').where({ conversation_id: conversationID, status: 'ready' });
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
          console.warn('[JEEVES]', '[MATRIX]', 'Failed to invite admin to room:', room);
        }
      }
    }

    this.emit('debug', '[JEEVES:CORE] Matrix connected and ready!');
  }

  async _handleMatrixError (error) {
    console.error('[JEEVES:CORE]', 'Matrix error:', error);
  }

  /**
   * Generate a response to a request.
   * @param {JeevesRequest} request The request.
   * @param {String} [request.room] Matrix room to retrieve conversation history from.
   * @returns {JeevesResponse}
   */
  async _handleRequest (request) {
    this.emit('debug', `[JEEVES:CORE] Handling request: ${JSON.stringify(request)}`);

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
    const moderator = new Actor({ name: '@jeeves/moderator' });
    const agents = {};

    const agentCount = 8;

    for (let i = 0; i < agentCount; i++) {
      const agent = new Actor({ name: `agent/${i}` });

      agent._handleConversationRequest = (request) => {

      };

      agents[agent.id] = agent;
    }

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
      content: 'Jeeves is researching your question...'
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

  async _handlePACERDebug (...params) {
    console.debug('[JEEVES]', '[PACER]', '[DEBUG]', ...params);
  }

  async _handlePACERCourt (court) {
    // console.debug('[JEEVES]', '[PACER]', 'court:', court);
    const actor = new Actor({ name: `pacer/courts/${court.id}` });
    const target = await this.db('courts').where({ pacer_id: court.id }).first();

    if (!target) {
      await this.db('courts').insert({
        fabric_id: actor.id,
        pacer_id: court.id,
        name: court.title,
        short_name: court.title,
        jurisdiction: court.court_name,
        slug: `pacer-${court.id}`
      });
    }
  }

  async _startWorkers () {
    for (let i = 0; i < this.workers.length; i++) {
      await this.workers[i].start();
    }
  }

  async _summarizeMessagesToTitle (messages, max = 100) {
    return new Promise((resolve, reject) => {
      const query = `Summarize our conversation into a ${max}-character maximum as a title.  Do not use quotation marks to surround the title, and be as specific as possible with regards to subject material so that the user can easily identify the title from a large list conversations.  Do not consider the initial prompt, focus on the user's messages as opposed to machine responses.`;
      const request = { query: query, messages: messages };
      this.alpha.query(request).catch(reject).then(resolve);
    });
  }

  async _summarizeCaseToLength (instance, max = 2048) {
    return new Promise(async (resolve, reject) => {
      const query = `Summarize the following case into a paragraph of text with a ${max}-character maximum:`
      + ` ${instance.title} (${instance.decision_date}, ${instance.harvard_case_law_court_name})\n\nDo not use quotation marks,`
      + ` and if you are unable to generate an accurate summary, return only "false".\n\n`
      + `Additional information:\n`
      + `  PACER Case ID: ${instance.pacer_case_id}`
      + `  Object:\n`
      + `    \`\`\`\n${JSON.stringify(instance, null, '  ').split('\n').join('\n    ')}\n    \`\`\``;

      console.debug('Case to summarize:', instance);

      if (instance.harvard_case_law_id) {
        const element = await this.harvard.getCaseByID(instance.harvard_case_law_id);
        console.debug('[NOVO]', '[SUMMARIZER]', 'Harvard case:', element);
      }

      const request = { query };

      this.createTimedRequest(request).then((output) => {
        console.debug('got summarized case:', output);
        resolve(output.content);
      });
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

  async _searchCases (request) {
    console.debug('[JEEVES]', '[SEARCH]', '[CASES]', 'Received search request:', request);
    const redisResults = await this.trainer.search(request);
    console.debug('[JEEVES]', '[SEARCH]', '[CASES]', 'Redis Results:', redisResults);

    const mappedQueries = redisResults.content.map((result) => {
      console.debug('[NOVO]', '[SEARCH]', '[CASES]', 'Mapping result:', result);
      return this.db('cases').where({ id: result.id }).first();
    });
    // const mappedResults = await Promise.all()

    // TODO: multiple case search sources
    // Retrieve Harvard's suggestions
    const result = await fetch(`https://api.case.law/v1/cases/?search=${request.query}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': (this.settings.harvard.token) ? `Bearer ${this.settings.harvard.token}` : undefined
      }
    });

    const harvard = await result.json();
    const ids = harvard.results.map(x => x.id);
    const harvardCases = await this.db('cases').select('id', 'title', 'short_name', 'harvard_case_law_court_name as court_name', 'decision_date').whereIn('harvard_case_law_id', ids).orderBy('decision_date', 'desc');

    if (this.courtlistener) {
      const courtListenerResults = await this.courtlistener.search({
        query: request.query,
        model: 'jeeves-0.2.0-RC1'
      });

      console.debug('[JEEVES]', '[SEARCH]', 'CourtListener dockets:', courtListenerResults.dockets);
      // TODO: concat into results
    }

    // TODO: queue crawl jobs for missing cases
    const cases = [].concat(harvardCases);

    console.debug('[NOVO]', '[SEARCH]', '[CASES]', 'Final cases:', cases);

    return cases;
  }

  async _searchCourts (request) {
    console.debug('[JEEVES]', '[SEARCH]', 'Searching courts:', request);
    if (!request) throw new Error('No request provided.');
    if (!request.query) throw new Error('No query provided.');

    const tokens = this._tokenizeTerm(request.query);
    const promises = tokens.map((token) => {
      return new Promise((resolve, reject) => {
        this._searchHarvardCourts({ query: token }).then(resolve).catch(reject);
      });
    });

    const candidates = await Promise.allSettled([
      (new Promise((resolve, reject) => {
        setTimeout(reject, 15000, new Error('Timeout!'));
      })),
      promises[0] // first token only
      // TODO: Harvard search
      // TODO: CourtListener search
    ]);

    console.debug('candidates:', candidates);
    const results = candidates.filter((x) => (x.status === 'fulfilled'));

    return results;
  }

  async _searchCourtsByTerm (term) {
    if (!term) throw new Error('No term provided.');
    return this._searchCourts({ query: term });
  }

  async _searchDocuments (request) {
    console.debug('[JEEVES]', '[SEARCH]', 'Searching documents :', request);
    if (!request) throw new Error('No request provided.');
    if (!request.query) throw new Error('No query provided.');

    let response = [];

    try {
      response = await this.db('documents ').select('*').where('content', 'like', `%${request.query}%`);
    } catch (exception) {
      console.error('[JEEVES]', '[SEARCH]', 'Failed to search documents :', exception);
    }

    return response;
  }

  async _searchHarvardCourts (request) {
    return new Promise((resolve, reject) => {
      fetch(`https://api.case.law/v1/courts/?search=${request.query}`).then((response) => {
        const object = response.json();
        resolve(object.results);
      }).catch(reject);
    });
  }

  async _searchJurisdictions (request) {
    console.debug('[JEEVES]', '[SEARCH]', 'Searching jurisdictions:', request);
    if (!request) throw new Error('No request provided.');
    if (!request.query) throw new Error('No query provided.');

    let response = [];

    try {
      response = await this.db('jurisdictions').select('*').where('name', 'like', `%${request.query}%`);
    } catch (exception) {
      console.error('[JEEVES]', '[SEARCH]', 'Failed to search jurisdictions:', exception);
    }

    return response;
  }

  async _searchReporters (request) {
    console.debug('[JEEVES]', '[SEARCH]', 'Searching reporters:', request);
    if (!request) throw new Error('No request provided.');
    if (!request.query) throw new Error('No query provided.');

    let response = [];

    try {
      response = await this.db('reporters').select('*').where('name', 'like', `%${request.query}%`);
    } catch (exception) {
      console.error('[JEEVES]', '[SEARCH]', 'Failed to search reporters:', exception);
    }

    return response;
  }

  async _searchPeople (request) {
    console.debug('[JEEVES]', '[SEARCH]', 'Searching people:', request);
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
    if (this.statutes) {
      const STATUTE_FIXTURE = await this.statutes.search({
        query: 'Texas'
      });
      console.debug('STATUTE_FIXTURE:', STATUTE_FIXTURE);
    }

    const FABRIC_FIXTURE = await this.fabric.search({
      query: 'North\nCarolina',
      model: 'jeeves-0.2.0-RC1'
    });
    console.debug('FABRIC FIXTURE:', FABRIC_FIXTURE);

    // Test the CourtListener database
    if (this.courtlistener) {
      const COURT_LISTENER_FIXTURE = await this.courtlistener.search({
        query: 'North\nCarolina',
        model: 'jeeves-0.2.0-RC1'
      });
      console.debug('COURT LISTENER FIXTURE:', COURT_LISTENER_FIXTURE);
    }

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
      randomCases = { content: `[${sourced.fabric_id}] [jeeves/cases/${sourced.id}] ${sourced.title}` };
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
    console.debug('[JEEVES]', '[VECTOR]', `Syncing ${limit} embeddings...`);
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
        this.db('jurisdictions').select('id', 'name').then(async (jurisdictions) => {
          for (let i = 0; i < jurisdictions.length; i++) {
            const element = jurisdictions[i];
            const actor = { name: `novo/jurisdictions/${element.id}` }; // Novo reference ID (name)
            const title = { name: `novo/jurisdictions/${element.id}/name`, content: element.name };
            const reference = await this.trainer.ingestDocument({ content: JSON.stringify(actor), metadata: actor });
            const embedding = await this.trainer.ingestDocument({ content: JSON.stringify(title), metadata: title });
            if (this.settings.verbosity > 4) console.debug('[JEEVES]', '[VECTOR]', '[JURISDICTIONS]', 'Ingested:', embedding);
          }
        }),
        this.db('courts').select('id', 'name').then(async (courts) => {
          for (let i = 0; i < courts.length; i++) {
            const element = courts[i];
            const actor = { name: `novo/courts/${element.id}` }; // Novo reference ID (name)
            const title = { name: `novo/courts/${element.id}/name`, content: element.name };
            const reference = await this.trainer.ingestDocument({ content: JSON.stringify(actor), metadata: actor });
            const embedding = await this.trainer.ingestDocument({ content: JSON.stringify(title), metadata: title });
            if (this.settings.verbosity > 4) console.debug('[JEEVES]', '[VECTOR]', '[COURTS]', 'Ingested:', embedding);
          }
        }),
        this.db('reporters').select('id', 'name').then(async (reporters) => {
          for (let i = 0; i < reporters.length; i++) {
            const element = reporters[i];
            const actor = { name: `novo/reporters/${element.id}` }; // Novo reference ID (name)
            const title = { name: `novo/reporters/${element.id}/name`, content: element.name };
            const reference = await this.trainer.ingestDocument({ content: JSON.stringify(actor), metadata: actor });
            const embedding = await this.trainer.ingestDocument({ content: JSON.stringify(title), metadata: title });
            if (this.settings.verbosity > 4) console.debug('[JEEVES]', '[VECTOR]', '[REPORTERS]', 'Ingested:', embedding);
          }
        }),
        this.db('cases').select('id', 'title', 'summary', 'decision_date', 'date_filed', 'date_argued', 'date_reargued', 'date_reargument_denied', 'date_blocked', 'date_last_filing', 'date_terminated', 'cause', 'nature_of_suit', 'jury_demand').orderByRaw('RAND()').limit(limit).then(async (cases) => {
          for (let i = 0; i < cases.length; i++) {
            const element = cases[i];
            const actor = { name: `novo/cases/${element.id}` }; // Novo reference ID (name)
            const title = { name: `novo/cases/${element.id}/title`, content: element.title };
            const whole = { name: `novo/cases/${element.id}`, content: element };
            const reference = await this.trainer.ingestDocument({ content: JSON.stringify(actor), metadata: actor });
            const embedding = await this.trainer.ingestDocument({ content: JSON.stringify(title), metadata: title });
            const megabody = await this.trainer.ingestDocument({ content: JSON.stringify(whole), metadata: whole }, 'case');
            if (this.settings.verbosity > 4) console.debug('[JEEVES]', '[VECTOR]', '[CASES]', 'Ingested:', megabody);
          }
        }),
        this.db('documents').select(['id', 'description', 'content']).whereNotNull('content').orderByRaw('RAND()').limit(limit).then(async (documents) => {
          for (let i = 0; i < documents.length; i++) {
            const element = documents[i];
            const actor = { name: `novo/documents/${element.id}` };
            // TODO: consider additional metadata fields
            const document = { name: `novo/documents/${element.id}`, content: element };
            const embedding = await this.trainer.ingestDocument({ content: JSON.stringify(document), metadata: document }, 'document');
            if (this.settings.verbosity > 4) console.debug('[JEEVES]', '[VECTOR]', '[DOCUMENTS]', 'Ingested:', embedding);
          }
        })
      ]).catch(reject).then(resolve);
    });
  }

  async _vectorSearchCases (query = '') {
    const words = await this.wordTokens(query);
    const uniques = [...new Set(words)];

    console.debug('[JEEVES]', '[VECTOR]', 'Searching for cases with words:', query);
    console.debug('[JEEVES]', '[VECTOR]', `Reduced ${words.length} words to ${uniques.length} uniques.`);

    const redisResults = await this.trainer.search({ query: query, resources: ['cases', 'documents'] });
    console.debug('[NOVO]', '[VECTOR]', 'Redis Results:', redisResults);

    const results = await Promise.all(uniques.map((word) => {
      return this.db('cases').select('id', 'title').where('title', 'like', `%${query}%`).limit(10);
    }));

    let cases = [];

    for (let i = 0; i < results.length; i++) {
      cases = cases.concat(results[i]);
    }

    if (cases.length > SEARCH_CASES_MAX_WORDS) cases = cases.slice(0, SEARCH_CASES_MAX_WORDS);

    const mapped = await Promise.all(redisResults.content.map((result) => {
      console.debug('[JEEVES]', '[VECTOR]', 'Mapping result:', result);
      if (!result || !result.metadata || !result.metadata.name) {
        console.debug('[JEEVES]', '[VECTOR]', 'Invalid result (no "name" metadata):', result);
        return null;
      }

      const parts = result.metadata.name.split('/');
      if (parts.length < 3) {
        console.debug('[JEEVES]', '[VECTOR]', 'Invalid parts:', parts);
        return null;
      }

      switch (parts[1]) {
        default:
          console.debug('[NOVO]', '[VECTOR]', 'Unknown type:', parts[1]);
          break;
        case 'cases':
          return this.db('cases').select('id', 'title').where('id', parts[2]).first();
      }
    }));

    console.debug('[JEEVES]', '[VECTOR]', 'Mapped Results:', mapped);

    return cases;
  }

  _handleServiceMessage (source, message) {
    // TODO: direct store to graph database
  }

  _handleTrustedLog (message) {
    this.emit('log', `[types/jeeves] Trusted Source emitted log: ${message}`);
  }

  _handleTrustedMessage (message) {
    this.emit('message', message);
  }

  _handleTrustedWarning (message) {
    this.emit('warning', `[types/jeeves] Trusted Source emitted warning: ${message}`);
  }

  _handleTrustedError (message) {
    this.emit('error', `[types/jeeves] Trusted Source emitted error: ${message}`);
  }

  _handleTrustedReady (message) {
    this.emit('log', `[types/jeeves] Trusted Source emitted ready: ${message}`);
  }

  _listServices () {
    return Object.keys(this.services);
  }

  _userMiddleware (req, res, next) {
    // const ephemera = new Key();
    req.user = {
      id: null
    };

    if (req.headers.authorization) {
      const header = req.headers.authorization.split(' ');

      if (header[0] == 'Bearer' && header[1]) {
        const token = header[1];
        const parts = token.split('.');

        if (parts && parts.length == 3) {
          const headers = parts[0];
          const payload = parts[1];
          const signature = parts[2];
          const inner = Token.base64UrlDecode(payload);

          try {
            const obj = JSON.parse(inner);
            if (this.settings.debug) console.debug('[AUTH]', 'Bearer Token:', obj);
            req.user.id = obj.sub;
            req.user.role = obj.role || 'asserted';
            req.user.state = obj.state || {};
          } catch (exception) {
            console.error('Invalid Bearer Token:', inner)
          }
        }
      }
    }

    next();
  }
}

module.exports = Jeeves;
