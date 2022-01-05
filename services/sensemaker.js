'use strict';

// Package
const definition = require('../package');

// Dependencies
const merge = require('lodash.merge');
const monitor = require('fast-json-patch');

// HTTP Bridge
const Server = require('@fabric/http/types/server');

// Fabric Types
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

// Sources
const Bitcoin = require('@fabric/core/services/bitcoin');
const Discord = require('@fabric/discord');
const Ethereum = require('@fabric/ethereum');
const Matrix = require('@fabric/matrix');
// const Shyft = require('@fabric/shyft');
const Twilio = require('@fabric/twilio');
const Twitter = require('@fabric/twitter');
// const GitHub = require('@fabric/github');

// Internal Types
const Learner = require('../types/learner');

/**
 * Sensemaker is a Fabric-powered application, capable of running autonomously
 * once started by the user.  By default, earnings are enabled.
 * @type {Object}
 * @extends {Service}
 */
class Sensemaker extends Service {
  /**
   * Constructor for the Sensemaker application.
   * @param  {Object} [settings={}] Map of configuration values.
   * @param  {Number} [settings.port=7777] Fabric messaging port.
   * @return {Sensemaker} Resulting instance of Sensemaker.
   */
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      debug: false,
      seed: null,
      port: 7777,
      path: './logs/sensemaker',
      http: {
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
      interval: 60000,
      verbosity: 2,
      workers: 1
    }, settings);

    this.clock = 0;

    this.agent = new Peer(this.settings);
    this.chain = new Chain(this.settings);
    this.queue = new Queue(this.settings);
    this.audits = new Logger(this.settings);
    this.learner = new Learner(this.settings);

    this.actors = new Collection({ name: 'Actors' });
    this.messages = new Collection({ name: 'Messages' });
    this.objects = new Collection({ name: 'Objects' });

    this.http = new Server({
      port: this.settings.http.port,
      resources: {
        Index: {
          route: '/',
          components: {
            list: 'sensemaker-index',
            view: 'sensemaker-index'
          }
        }
      }
    });

    this.services = {};
    this.sources = {};
    this.workers = [];
    this.changes = new Logger({
      name: 'sensemaker',
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
    await this._registerService('bitcoin', Bitcoin);
    await this._registerService('discord', Discord);
    await this._registerService('ethereum', Ethereum); // TODO: swap back for Ethereum
    await this._registerService('matrix', Matrix);
    await this._registerService('twilio', Twilio);
    await this._registerService('twitter', Twitter);
    // await this._registerService('shyft', Shyft);
    // await this._registerService('github', GitHub);

    // Start the logging service
    await this.audits.start();
    await this.changes.start();

    await this.restore();

    // Record all future activity
    this.on('commit', async function _handleInternalCommit (commit) {
      await self.audits.log(commit);
      self.alert('Commitment: ```\n' + JSON.stringify(commit, null, '  ') + '\n```');
    });

    // TODO: remove
    this.on('block', async function (block) {
      self.emit('log', `Proposed Block: ${JSON.stringify(block, null, '  ')}`);
    });

    await this._startAllServices();

    // Listen for HTTP events, if enabled
    if (this.settings.http.listen) this.trust(this.http);
    this.trust(this.agent);

    // Queue up a verification job
    this.queue._addJob({ method: 'verify', params: [] });
    this._heart = setInterval(this.tick.bind(this), this.settings.interval);

    // Start HTTP, if enabled
    if (this.settings.http.listen) await this.http.start();

    // Fabric Network
    await this.agent.start();

    // Set status...
    this.status = 'started';

    // Commit to change
    await this.commit();

    // Emit log events
    this.emit('log', '[SENSEMAKER] Started!');
    this.emit('log', `[SENSEMAKER] Services available: ${JSON.stringify(this._listServices(), null, '  ')}`);
    this.emit('log', `[SENSEMAKER] Services enabled: ${JSON.stringify(this.settings.services, null, '  ')}`);

    // Emit ready event
    this.emit('ready');

    // DEBUG
    this.alert(`Sensemaker started.  Agent ID: ${this.id}`);

    // return the instance!
    return this;
  }

  /**
   * Stop the process.
   * @return {Promise} Resolves once the process has been stopped.
   */
  async stop () {
    this.status = 'STOPPING';

    for (const [name, service] of Object.entries(this.services)) {
      if (this.settings.services.includes(name)) {
        await this.services[name].stop();
      }
    }

    if (this.settings.listen) await this.agent.stop();
    if (this.settings.http.listen) await this.settings.http.stop();

    this.status = 'STOPPED';
    await this.commit();

    this.emit('stopped', {
      id: this.id
    });

    return this;
  }

  async _attachWorkers () {
    for (let i = 0; i < this.settings.workers; i++) {
      const worker = new Worker();
      this.workers.push(worker);
    }
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
      return this._appendWarning(`Service already registered: ${name}`);
    }

    this.services[name] = service;
    this.services[name].on('error', function (msg) {
      self._appendError(`Service "${name}" emitted error: ${JSON.stringify(msg, null, '  ')}`);
    });

    this.services[name].on('warning', function (msg) {
      self._appendWarning(`Service warning from ${name}: ${JSON.stringify(msg, null, '  ')}`);
    });

    this.services[name].on('message', function (msg) {
      self._appendMessage(`Service message from ${name}: ${JSON.stringify(msg, null, '  ')}`);
      self.node.relayFrom(self.node.id, Message.fromVector(['ChatMessage', JSON.stringify(msg)]));
    });

    this.on('identity', async function _registerActor (identity) {
      if (this.settings.services.includes(name)) {
        self._appendMessage(`Registering actor on service "${name}": ${JSON.stringify(identity)}`);

        try {
          let registration = await this.services[name]._registerActor(identity);
          self._appendMessage(`Registered Actor: ${JSON.stringify(registration, null, '  ')}`);
        } catch (exception) {
          self._appendError(`Error from service "${name}" during _registerActor: ${exception}`);
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
}

module.exports = Sensemaker;
