'use strict';

// Dependencies
const merge = require('lodash.merge');
const definition = require('../package');

// Fabric Types
const App = require('@fabric/core/types/app');
const Queue = require('@fabric/core/types/queue');
const Message = require('@fabric/core/types/message');
const Worker = require('@fabric/core/types/worker');

// HTTP
const Server = require('@fabric/http/types/server');

// Sources
const Bitcoin = require('@fabric/core/services/bitcoin');
const Discord = require('@fabric/discord');
const Ethereum = require('@fabric/ethereum');
const Matrix = require('@fabric/matrix');
// const Shyft = require('@fabric/shyft');
const Twilio = require('@fabric/twilio');
const Twitter = require('@fabric/twitter');

/**
 * Sensemaker is a Fabric-powered application, capable of running autonomously
 * once started by the user.  By default, earnings are enabled.
 * @type {Object}
 */
class Sensemaker extends App {
  /**
   * Constructor for the Sensemaker application.
   * @param  {Object} [settings={}] Map of configuration values.
   * @return {Sensemaker}           Instance of Sensemaker.
   */
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      debug: true,
      seed: null,
      port: 7777,
      http: {
        listen: true,
        port: 4242
      },
      interval: 60000,
      workers: 1
    }, settings);

    this.clock = 0;
    this.queue = new Queue(this.settings);
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

    this.sources = {};
    this.workers = [];

    this._state = {
      clock: this.clock,
      status: 'ready',
      actors: {},
      messages: {},
      objects: {}
    };

    return this;
  }

  get version () {
    return definition.version;
  }

  alert (msg) {
    for (const [name, service] of Object.entries(this.services)) {
      if (!this.settings.services.includes(name)) continue;
      const service = this.services[name];
      switch (name) {
        case 'discord':
        case 'matrix':
        case 'twilio':
          service.alert(msg);
          break;
        default:
          break;
      }
    }
  }

  tick () {
    const now = (new Date()).toISOString();
    ++this.clock;
    this._state.clock = this.clock;
    const heartbeat = Message.fromVector(['Generic', {
      clock: this.clock,
      created: now
    }]);
    this.emit('heartbeat', heartbeat);
  }

  /**
   * Explicitly trust all events from a known source.
   * @param  {EventEmitter} source Emitter of events.
   * @return {Sensemaker}          Instance of Sensemaker after binding events.
   */
  trust (source) {
    source.on('log', this._handleTrustedLog.bind(this));
    source.on('debug', this._handleTrustedDebug.bind(this));
    source.on('warning', this._handleTrustedWarning.bind(this));
    source.on('error', this._handleTrustedError.bind(this));
    source.on('message', this._handleTrustedMessage.bind(this));
    source.on('ready', this._handleTrustedReady.bind(this));
  }

  async ingest (data) {
    await this.queue._addJob('ingest', [data]);
  }

  /**
   * Start the process.
   * @return {Promise} Resolves once the process has been started.
   */
  async start () {
    // Register Services
    this._registerService('bitcoin', Bitcoin);
    this._registerService('discord', Discord);
    this._registerService('ethereum', Ethereum);
    this._registerService('matrix', Matrix);
    this._registerService('twilio', Twilio);
    this._registerService('twitter', Twitter);
    // this._registerService('shyft', Shyft);

    // Internal Listeners
    this.on('heartbeat', async function (beat) {
      this.alert(`Heartbeat: ${JSON.stringify(beat, null, '  ')}`);
    });


    if (this.settings.http.listen) this.trust(this.http);

    for (const [name, service] of Object.entries(this.services)) {
      if (this.settings.services.includes(name)) {
        this.trust(this.services[name]);
        await this.services[name].start();
      }
    }

    this.queue._addJob({ method: 'verify', params: [] });
    this._heartbeat = setInterval(this.tick.bind(this), this.settings.interval);

    // 1. define trust model
    // await this.server.trust(this.fabric);
    // 2. wait for local node
    // await this.fabric.start();
    // 3. start the interface
    if (this.settings.http.listen) await this.http.start();

    // set status...
    this.status = 'started';

    // commit to change
    this.commit();

    // emit log events
    this.emit('log', `[SENSEMAKER] Started!`);
    this.emit('log', `[SENSEMAKER] Services available: ${JSON.stringify(this._listServices(), null, '  ')}`);
    this.emit('log', `[SENSEMAKER] Services enabled: ${JSON.stringify(this.settings.services, null, '  ')}`);

    // emit ready event
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
    this.status = 'stopping';

    for (const [name, service] of Object.entries(this.services)) {
      if (this.settings.services.includes(name)) {
        await this.services[name].stop();
      }
    }

    this.status = 'stopped';
    this.commit();
    this.emit('stopped');
    return this;
  }

  async _attachWorkers () {
    for (const i = 0; i < this.settings.workers; i++) {
      const worker = new Worker();
      this.workers.push(worker);
    }
  }

  async _startWorkers () {
    for (const i = 0; i < this.workers.length; i++) {
      await this.workers[i].start();
    }
  }

  _registerService (name, type) {
    super._registerService(name, type);
    const service = this.services[name];
    if (service.routes && service.routes.length) {
      for (let i = 0; i < service.routes.length; i++) {
        const route = service.routes[i];
        this.http._addRoute(route.method, route.path, route.handler);
      }
    }
  }

  _handleTrustedLog (message) {
    this.emit('log', `[types/sensemaker] Trusted Source emitted log: ${message}`);
  }

  _handleTrustedDebug (message) {
    console.log('trusted debug:', message);
    this.emit('debug', `[types/sensemaker] Trusted Source emitted debug: ${message}`);
  }

  _handleTrustedMessage (message) {
    this.emit('log', `[types/sensemaker] Trusted Source emitted message: ${message}`);
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
