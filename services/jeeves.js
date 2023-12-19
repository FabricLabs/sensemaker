'use strict';

// Prepare transpilation
require('@babel/register');

const why = require('why-is-node-running');

// Package
const definition = require('../package');
const {
  PER_PAGE_LIMIT,
  PER_PAGE_DEFAULT
} = require('../constants');

// Dependencies
const fs = require('fs');

// External Dependencies
// const { ApolloServer, gql } = require('apollo-server-express');
const { hashSync, compareSync, genSaltSync } = require('bcrypt');
const fetch = require('cross-fetch');
const merge = require('lodash.merge');
const levelgraph = require('levelgraph');
const knex = require('knex');
const { attachPaginate } = require('knex-paginate');

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
// const Prices = require('@portal/feed');

// Services
const OpenAI = require('./openai');
// TODO: Mistral
// TODO: HarvardCaseLaw
const CourtListener = require('./courtlistener');
// TODO: WestLaw

// Internal Types
const Agent = require('../types/agent');
// const Brain = require('../types/brain');
const Learner = require('../types/learner');
const Worker = require('../types/worker');

// Components
const CaseHome = require('../components/CaseHome');
const CaseView = require('../components/CaseView');
const Conversations = require('../components/Conversations');

/**
 * Jeeves is a Fabric-powered application, capable of running autonomously
 * once started by the user.  By default, earnings are enabled.
 * @type {Object}
 * @extends {Service}
 */
class Jeeves extends Service {
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
      persistent: true,
      path: './logs/jeeves',
      coordinator: '!TsLXBhlUcDLbRtOYIU:fabric.pub',
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
      services: [
        'bitcoin'
      ],
      crawlDelay: 2500,
      interval: 86400 * 1000,
      verbosity: 2,
      workers: 1
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
    // this.sandbox = new Sandbox(this.settings.sandbox);
    this.worker = new Worker(this.settings);

    // Services
    this.matrix = new Matrix(this.settings.matrix);
    this.openai = new OpenAI(this.settings.openai);

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

    /* const resolvers = require('../resolvers');
    const typeDefs = gql`
      type User {
        id: ID!
        email: String!
      }

      type Query {
        users: [User]
      }
    `; */

    this.apollo = null; /* new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req }) => {
        return {
          db: this.db
        };
      }
    }); */

    this.services = {};
    this.sources = {};
    this.workers = [];
    this.changes = new Logger({
      name: 'jeeves',
      path: './stores'
    });

    // Streaming
    this.completions = {};

    // State
    this._state = {
      clock: this.clock,
      status: 'STOPPED',
      actors: {},
      audits: {},
      epochs: [],
      messages: {},
      objects: {}
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
      }
    });

    console.debug('COURTLISTENER SETTINGS:', this.settings.courtlistener);
    this.courtlistener = new CourtListener(this.settings.courtlistener);

    attachPaginate();

    // Stop case
    /* process.on('exit', async () => {
      console.warn('Jeeves is shutting down...');
      await this.stop();
    }); */

    return this;
  }

  get version () {
    return definition.version;
  }

  /* commit () {
    // console.warn('Jeeves is attempting a safe shutdown...');
    // TODO: safe shutdown
  } */

  async tick () {
    const now = (new Date()).toISOString();
    this._lastTick = now;
    this._state.clock = ++this.clock;
    return this.commit();
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

    this.alert('Heartbeat: ```\n' + data + '\n```');

    this.emit('beat', beat);
    this.emit('block', {
      created: now,
      transactions: []
    });

    return beat;
  }

  async restore () {
    const last = await this.changes._getLastLine();
    // TODO: load from STATE file
    return this;
  }

  async ingest (data) {
    await this.queue._addJob('ingest', [data]);
  }

  /**
   * Start the process.
   * @return {Promise} Resolves once the process has been started.
   */
  async start () {
    const self = this;

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

    this.worker.register('Ingest', async (...params) => {
      console.debug('Handling Ingest job:', params);

      try {
        await this.db('cases').update({
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
        await this.db('cases').update({
          pdf_acquired: true
        }).where('id', params[2].id);
      } catch (exception) {
        this.emit('error', `Worker could not update database: ${params} ${exception}`);
      }

      console.debug('Ingest complete:', params[1]);
    });

    this.worker.register('ScanCourtListener', async (...params) => {
      console.debug('SCANNING COURT LISTENER WITH PARAMS:', params);
      try {
        const dockets = this.courtlistener('search_docket').select('*').limit(5);
        console.debug('POSTGRES DOCKETS:', dockets.data);
      } catch (exception) {
        console.error('COURTLISTENER ERROR:', exception);
      }
    });

    this.worker.on('debug', (...debug) => console.debug(...debug));
    this.worker.on('log', (...log) => console.log(...log));
    this.worker.on('warning', (...warning) => console.warn(...warning));
    this.worker.on('error', (...error) => console.error(...error));

    this.matrix.on('activity', this._handleMatrixActivity.bind(this));
    this.matrix.on('ready', this._handleMatrixReady.bind(this));

    this.openai.on('error', this._handleOpenAIError.bind(this));
    this.openai.on('MessageStart', this._handleOpenAIMessageStart.bind(this));
    this.openai.on('MessageChunk', this._handleOpenAIMessageChunk.bind(this));
    this.openai.on('MessageEnd', this._handleOpenAIMessageEnd.bind(this));
    this.openai.on('MessageWarning', this._handleOpenAIMessageWarning.bind(this));

    // Retrieval Augmentation Generator (RAG)
    this.rag = new Agent(this.settings);

    // Start the logging service
    await this.audits.start();
    await this.changes.start();

    // Load State
    await this.restore();

    // Internal Services
    await this.openai.start();
    // await this.matrix.start();

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
        const db = this.db;
        const unknown = await this.db('cases').where('pdf_acquired', false).where(function () {
          this.where('last_harvard_crawl', '<', db.raw('DATE_SUB(NOW(), INTERVAL 1 DAY)')).orWhereNull('last_harvard_crawl');
        }).whereNotNull('harvard_case_law_id').whereNotNull('harvard_case_law_pdf').orderBy('decision_date', 'desc').first();

        console.debug('[INGEST] Found uningested case:', unknown.title);
        if (!unknown || !unknown.harvard_case_law_pdf) return;

        this.worker.addJob({
          type: 'Ingest',
          params: [
            unknown.harvard_case_law_pdf,
            `stores/harvard/${unknown.harvard_case_law_id}.pdf`,
            { id: unknown.id }
          ]
        });

        this.worker.addJob({
          type: 'ScanCourtListener',
          params: []
        });
      }, this.settings.crawlDelay);
    }

    // Internal APIs
    this.http._addRoute('POST', '/inquiries', async (req, res) => {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
      }

      try {
        // Check if the username already exists
        const existingInquiry = await this.db('inquiries').where('email', email).first();
        if (existingInquiry) {
          return res.status(409).json({ message: "You're already on the waitlist!" });
        }

        // Insert the new user into the database
        const newInquiry = await this.db('inquiries').insert({
          email: email
        });

        return res.json({ message: "You've been added to the waitlist!" });
      } catch (error) {
        return res.status(500).json({ message: 'Internal server error.  Try again later.' });
      }
    });

    this.http._addRoute('POST', '/invitations', async (req, res) => {
      // TODO: check for admin token
      const { inquiry_id } = req.body;

      const inserted = await this.db('invitations').insert({
        inquiry_id: inquiry_id
      });

      console.debug('inserted:', inserted);

      res.send({
        message: 'Invitation sent successfully!'
      });
    });

    this.http._addRoute('GET', '/invitations/:id', async (req, res) => {
      // TODO: render page for accepting invitation
      // - create user account
      // - set user password
      // - create help conversation
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

    this.http._addRoute('GET', '/sessions/new', async (req, res, next) => {
      return res.send(this.http.app.render());
    });


    this.http._addRoute('POST', '/sessions', async (req, res, next) => {
      const { username, password } = req.body;
      // console.debug('handling incoming login:', username, `${password ? '(' + password.length + ' char password)' : '(no password'} ...`);

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
      }

      try {
        const user = await this.db('users').where('username', username).first();
        if (!user || !compareSync(password, user.password)) {
          return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const token = new Token({
          capability: 'OP_IDENTITY',
          issuer: null,
          subject: user.id
        });

        return res.json({
          message: 'Authentication successful.',
          token: token.toString(),
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin,
          isCompliant: user.is_compliant
        });
      } catch (error) {
        console.error('Error authenticating user: ', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

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

    this.http._addRoute('GET', '/cases', async (req, res, next) => {
      res.format({
        json: async () => {
          const cases = await this.db.select('id', 'title', 'short_name', 'created_at', 'decision_date', 'harvard_case_law_court_name as court_name').from('cases').where({
            // TODO: filter by public/private value
            'pdf_acquired': true
          }).orderBy('decision_date', 'desc').paginate({
            perPage: PER_PAGE_LIMIT,
            currentPage: 1
          });

          res.setHeader('X-Pagination', true);
          res.setHeader('X-Pagination-Current', `${cases.pagination.from}-${cases.pagination.to}`);
          res.setHeader('X-Pagination-Per', cases.pagination.perPage);
          res.setHeader('X-Pagination-Total', cases.pagination.total);

          res.send(cases.data);
        },
        html: () => {
          // TODO: import auth token, load data
          const page = new CaseHome({});
          const output = page.toHTML();
          return res.send(this.http.app._renderWith(output));
        }
      });
    });

    this.http._addRoute('GET', '/cases/:id', async (req, res, next) => {
      const instance = await this.db.select('id', 'title', 'short_name', 'created_at', 'decision_date', 'summary', 'harvard_case_law_id', 'harvard_case_law_court_name as court_name', 'harvard_case_law_court_name').from('cases').where({
        id: req.params.id
      }).first();

      const canonicalTitle = `${instance.title} (${instance.decision_date}, ${instance.harvard_case_law_court_name})`;

      // Embeddings
      /* const embeddedTitle = await */ this._generateEmbedding(instance.title);
      /* const embeddedKey = await */ this._generateEmbedding(canonicalTitle);

      if (!instance.summary) {
        const summary = await this._summarizeCaseToLength(instance);

        if (summary) {
          await this.db('cases').update({
            summary: summary
          }).where('id', instance.id);

          instance.summary = summary;
        }
      }

      fetch(`https://api.case.law/v1/cases/${instance.harvard_case_law_id}`, {
        // TODO: additional params (auth?)
      }).catch((exception) => {
        console.error('FETCH FULL CASE ERROR:', exception);
      }).then(async (output) => {
        const target = await output.json();
        const message = Message.fromVector(['HarvardCase', JSON.stringify(target)]);
        this.http.broadcast(message);
      });

      res.format({
        json: async () => {
          res.send(instance);
        },
        html: () => {
          // TODO: provide state
          // const page = new CaseView({});
          // TODO: fix this hack
          const page = new CaseHome({}); // TODO: use CaseView
          const html = page.toHTML();
          return res.send(this.http.app._renderWith(html));
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
          const conversations = await this.db.select('id', 'title', 'created_at').from('conversations').where({ creator_id: req.user.id }).orderBy('updated_at', 'desc');
          // TODO: update the conversation upon change (new user message, new agent message)
          // TODO: sort conversations by updated_at (below line)
          // const conversations = await this.db.select('id', 'title', 'created_at').from('conversations').orderBy('updated_at', 'desc');
          res.send(conversations);
        },
        html: () => {
          // TODO: provide state
          const page = new Conversations({});
          const html = page.toHTML();
          return res.send(this.http.app._renderWith(html));
        }
      });
    });

    this.http._addRoute('GET', '/courts', async (req, res, next) => {
      const courts = await this.db.select('id', 'name', 'created_at').from('courts').orderBy('name', 'asc');
      res.send(courts);
    });

    this.http._addRoute('GET', '/messages', async (req, res, next) => {
      let messages = [];

      if (req.query.conversation_id) {
        messages = await this.db('messages').join('users', 'messages.user_id', '=', 'users.id').select('users.username', 'messages.id', 'messages.user_id', 'messages.created_at', 'messages.content', 'messages.status').where({
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
      const messages = await knex('messages')
        .whereIn('id', conversation.log)
        .select('id', 'content', 'created_at');

      conversation.messages = messages;

      res.send(conversation);
    });

    this.http._addRoute('GET', '/contracts/terms-of-use', async (req, res, next) => {
      const contract = fs.readFileSync('./contracts/terms-of-use.md').toString('utf8');
      res.send({
        content: contract
      });
    });

    this.http._addRoute('GET', '/statistics/admin', async (req, res, next) => {
      const inquiries = await this.db('inquiries').select('id');
      const invitations = await this.db('invitations').select('id').from('invitations');

      // User Analytics
      const users = await this.db('users').select('id', 'username');

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const conversations = await this.db('conversations').select('id').where({ creator_id: user.id });
        const messages = await this.db('messages').select('id').where({ user_id: user.id });

        user.conversations = conversations.length;
        user.messages = messages.length;
      }

      const stats = {
        inquiries: {
          total: inquiries.length
        },
        invitations: {
          total: invitations.length
        },
        users: {
          total: users.length,
          content: users
        }
      };

      res.send(stats);
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

    this.http._addRoute('SEARCH', '/cases', async (req, res, next) => {
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
    });

    this.http._addRoute('POST', '/messages', async (req, res, next) => {
      console.debug('Handling inbound message:', req.body);

      let isNew = false;
      let subject = null;
      let {
        case_id,
        conversation_id,
        content
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

        const newMessage = await this.db('messages').insert({
          content: content,
          conversation_id: conversation_id,
          user_id: req.user.id
        });

        const inserted = await this.db('requests').insert({
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
          // TODO: restore response tracking
          /* this.db('responses').insert({
            // TODO: store request ID
            content: output.object.content
          }); */

          // TODO: restore titling
          if (isNew) {
            const messages = await this._getConversationMessages(conversation_id);

            await this._summarizeMessagesToTitle(messages.map((x) => {
              return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
            })).then(async (output) => {
              const title = output?.content;
              if (title) await this.db('conversations').update({ title }).where({ id: conversation_id });

              const conversation = { id: conversation_id, messages: messages, title: title };
              const message = Message.fromVector(['Conversation', JSON.stringify(conversation)]);

              this.http.broadcast(message);
            });
          }
        });

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

    this.http._addRoute('POST', '/messagesRegen', async (req, res, next) => {
      console.debug('Handling inbound message:', req.body);

      let isNew = false;
      let subject = null;
      let {
        case_id,
        conversation_id,
        content,
        messageID
      } = req.body;

      if (case_id) {
        subject = await this.db('cases').select('id', 'title', 'harvard_case_law_court_name as court_name', 'decision_date').where('id', case_id).first();
      }

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

    this.http._addRoute('POST', '/announcementCreate', async (req, res, next) => {
      // TODO: check token
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
        this.http._addRoute('POST', '/announcementCreate', async (req, res, next) => {
      // TODO: check token
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

    this.http._addRoute('GET', '/announcementFetch', async (req, res, next) => {
      try {
        const latestAnnouncement = await this.db('announcements')
          .select('*') 
          .orderBy('created_at', 'desc')
          .first();

        if (!latestAnnouncement) {
          return res.status(404).json({ message: 'No announcements found.' });
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
    this.emit('log', `[JEEVES] Services available: ${JSON.stringify(this._listServices(), null, '  ')}`);
    this.emit('log', `[JEEVES] Services enabled: ${JSON.stringify(this.settings.services, null, '  ')}`);

    // Emit ready event
    this.emit('ready');

    // DEBUG
    this.alert(`Jeeves started.  Agent ID: ${this.id}`);

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

  async _handleMatrixActivity (activity) {
    console.log('matrix activity:', activity);
    if (activity.actor == this.matrix.id) return;

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
    const message = Message.fromVector(['MessageChunk', JSON.stringify(chunk)]);
    this.http.broadcast(message);
  }

  async _handleOpenAIMessageEnd (end) {
    await this.db('messages').where({ 'id': end.id }).update({
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
        await this.matrix.client.invite(room, '@eric:fabric.pub');
      }
    }

    this.emit('debug', '[JEEVES:CORE] Matrix connected and ready!');
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

    const inserted = await this.db('messages').insert({
      conversation_id: request.conversation_id,
      user_id: 1,
      status: 'computing',
      content: 'Jeeves is researching your question...'
    });

    const response = await this.openai._streamConversationRequest({
      conversation_id: request.conversation_id,
      message_id: inserted[0],
      messages: messages
      // prompt: request.input
    });

    const updated = await this.db('messages').where({ id: inserted[0] }).update({
      status: 'ready',
      content: response.content.trim()
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
      content: response.content.trim()
    };
  }

  async _startWorkers () {
    for (let i = 0; i < this.workers.length; i++) {
      await this.workers[i].start();
    }
  }

  async _summarizeMessagesToTitle (messages, max = 100) {
    return new Promise((resolve, reject) => {
      const query = `Summarize our conversation into a ${max}-character maximum as a title.  Do not use quotation marks to surround the title.`;
      const request = {
        input: query,
        messages: messages
      };
 
      this._handleRequest(request).then((output) => {
        console.debug('got summarized title:', output);
        resolve(output);
      });
    });
  }

  async _summarizeCaseToLength (instance, max = 2048) {
    const query = `Summarize the following case into a paragraph of text with a ${max}-character maximum: ${instance.title} (${instance.decision_date}, ${instance.harvard_case_law_court_name})\n\nDo not use quotation marks, and if you are unable to generate an accurate summary, return only "false".`;
    console.debug('Case to summarize:', instance);

    const request = { input: query };

    this._handleRequest(request).then((output) => {
      console.debug('got summarized case:', output);
    });
  }

  async _generateEmbedding (text = '', model = 'text-embedding-ada-002') {
    const embedding = await this.openai.generateEmbedding(text, model);
    console.debug('got embedding:', embedding);

    const inserted = await this.db('embeddings').insert({
      text: text,
      model: embedding[0].model,
      content: JSON.stringify(embedding[0].embedding)
    });

    console.debug('inserted:', inserted);

    return {
      id: inserted[0]
    };
  }

  async _searchCases (request) {
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
    const harvardCases = await this.db('cases').select('id', 'title', 'short_name', 'harvard_case_law_court_name as court_name', 'decision_date').whereIn('harvard_case_law_id', ids);

    // TODO: queue crawl jobs for missing cases
    const cases = [].concat(harvardCases);

    return cases;
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
            req.user.id = obj.sub;
            req.user.role = obj.role || 'asserted';
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
