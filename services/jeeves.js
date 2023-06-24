'use strict';

// Package
const definition = require('../package');

// Dependencies
const { hashSync, compareSync, genSaltSync } = require('bcrypt');
const merge = require('lodash.merge');
const monitor = require('fast-json-patch');
const levelgraph = require('levelgraph');
const mysql = require('mysql2/promise');
const knex = require('knex');

// HTTP Bridge
const HTTPServer = require('@fabric/http/types/server');

// Fabric Types
// TODO: reduce to whole library import?
// const App = require('@fabric/core/types/app');
const Peer = require('@fabric/core/types/peer');
const Actor = require('@fabric/core/types/actor');
const Chain = require('@fabric/core/types/chain');
const Queue = require('@fabric/core/types/queue');
const Logger = require('@fabric/core/types/logger');
const Worker = require('@fabric/core/types/worker');
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

// Internal Types
const Learner = require('../types/learner');

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
      debug: false,
      seed: null,
      port: 7777,
      persistent: true,
      path: './logs/jeeves',
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
      interval: 86400 * 1000,
      verbosity: 2,
      workers: 1
    }, settings);

    // Vector Clock
    this.clock = 0;

    // Internals
    this.agent = new Peer(this.settings);
    this.chain = new Chain(this.settings);
    this.queue = new Queue(this.settings);
    this.audits = new Logger(this.settings);
    this.learner = new Learner(this.settings);

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
    this.db = knex({
      client: 'mysql2',
      connection: this.settings.db
    });

    // HTTP Interface
    this.http = new HTTPServer({
      path: 'assets',
      hostname: this.settings.http.hostname,
      interface: this.settings.http.interface,
      port: this.settings.http.port,
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
      }
    });

    this.services = {};
    this.sources = {};
    this.workers = [];
    this.changes = new Logger({
      name: 'jeeves',
      path: './stores'
    });

    this._state = {
      clock: this.clock,
      status: 'STOPPED',
      actors: {},
      audits: {},
      epochs: [],
      messages: {},
      objects: {}
    };

    return this;
  }

  get version () {
    return definition.version;
  }

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

    this.matrix.on('activity', this._handleMatrixActivity.bind(this));
    this.matrix.on('ready', this._handleMatrixReady.bind(this));

    this.openai.on('error', this._handleOpenAIError.bind(this));

    // Start the logging service
    await this.audits.start();
    await this.changes.start();

    // Load State
    await this.restore();

    // Internal Services
    await this.openai.start();
    await this.matrix.start();

    // Record all future activity
    this.on('commit', async function _handleInternalCommit (commit) {
      await self.audits.log(commit);
      // self.alert('Commitment: \n```\n' + JSON.stringify(commit, null, '  ') + '\n```');
    });

    // TODO: remove
    this.on('block', async function (block) {
      self.emit('log', `Proposed Block: ${JSON.stringify(block, null, '  ')}`);
    });

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

    this.http._addRoute('POST', '/sessions', async (req, res, next) => {
      const { username, password } = req.body;

      console.log('handling incoming login:', username, `${password ? '(' + password.length + ' char password)' : '(no password'} ...`);

      // Check if the username and password are provided
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
      }

      try {
        // Query the database to find the user
        const user = await this.db('users').where('username', username).first();
        if (!user || !compareSync(password, user.password)) {
          return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Authentication successful
        return res.json({ message: 'Authentication successful.', token: 'foop' });
      } catch (error) {
        console.error('Error authenticating user: ', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });

    this.http._addRoute('GET', '/conversations', (req, res, next) => {
      const conversations = [
        { _id: 'foo', title: 'Rando Convo', participants: [], log: [] }
      ];

      res.send(conversations);
    });

    // await this._startAllServices();

    // Listen for HTTP events, if enabled
    if (this.settings.http.listen) this.trust(this.http);
    this.trust(this.agent);

    // Queue up a verification job
    this.queue._addJob({ method: 'verify', params: [] });
    this._heart = setInterval(this.tick.bind(this), this.settings.interval);

    // Start HTTP, if enabled
    if (this.settings.http.listen) await this.http.start();

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

    clearInterval(this._heart);

    for (const [name, service] of Object.entries(this.services)) {
      if (this.settings.services.includes(name)) {
        await this.services[name].stop();
      }
    }

    if (this.settings.listen) await this.agent.stop();
    if (this.settings.http.listen) await this.http.stop();

    this.status = 'STOPPED';
    await this.commit();

    this.emit('stopped', {
      id: this.id
    });

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
    // console.log('matrix activity:', activity);
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

    const computedReactions = await this.matrix._getReactions(activity.object.id);
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

  /**
   * Retrieve a conversation's messages.
   * @returns {Array} List of the conversation's messages.
   */
  async _getConversationMessages (channelID) {
    const messages = [];
    const room = this.matrix.client.getRoom(channelID);

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

  async _handleMatrixReady () {
    const name = `${this.settings.alias} (${this.settings.moniker} v${this.settings.version})`;
    if (this.matrix._getAgentDisplayName() !== name) await this.matrix._setAgentDisplayName(name);

    const roomResult = await this.matrix.client.getJoinedRooms();

    for (let i = 0; i < roomResult.joined_rooms.length; i++) {
      const room = roomResult.joined_rooms[i];
      const members = await this.matrix.client.getJoinedRoomMembers(room);
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

    const messages = await this._getConversationMessages(request.room);

    // Prompt
    messages.unshift({ role: 'user', content: this.settings.prompt });

    const openai = await this.openai._handleConversationRequest({
      messages: messages
    });

    // If we get a preferred response, use it.  Otherwise fall back to a generic response.
    const text = (typeof openai !== 'undefined' && openai)
      ? openai.completion.choices[0].message.content.trim()
      : 'Generic response.'
      ;

    this.emit('response', {
      prompt: request.input,
      response: text
    });

    return {
      openai: openai,
      object: {
        content: text
      }
    };
  }

  async _startWorkers () {
    for (let i = 0; i < this.workers.length; i++) {
      await this.workers[i].start();
    }
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
}

module.exports = Jeeves;
