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
const Shyft = require('@shyft/core');
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
      seed: null,
      port: 7777,
      http: {
        port: 4242
      },
      interval: 60000,
      workers: 1
    }, settings);

    this.clock = 0;
    this.queue = new Queue(this.settings);
    this.server = new Server(this.settings);
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

  tick () {
    const timestamp = (new Date()).toISOString();
    ++this.clock;
    this._state.clock = this.clock;
    const heartbeat = Message.fromVector(['Generic', {
      clock: this.clock,
      created: timestamp
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
    source.on('warning', this._handleTrustedWarning.bind(this));
    source.on('error', this._handleTrustedError.bind(this));
    source.on('message', this._handleTrustedMessage.bind(this));
  }

  async ingest (data) {
    await this.queue._addJob('ingest', [data]);
  }

  /**
   * Start the process.
   * @return {Promise} Resolves once the process has been started.
   */
  async start () {
    await this._registerService('bitcoin', Bitcoin);
    await this._registerService('discord', Discord);
    await this._registerService('ethereum', Ethereum);
    await this._registerService('matrix', Matrix);
    await this._registerService('twilio', Twilio);
    await this._registerService('twitter', Twitter);
    await this._registerService('shyft', Shyft);

    for (const [name, service] of Object.entries(this.services)) {
      // TODO: check for service enabled in `this.settings.services`
      // code can be copied from @fabric/core/types/cli OR @fabric/core/types/app
      console.warn(`Starting service: ${name}`);
      // await this.services[name]._bindStore(this.store);
      await this.services[name].start();
    }

    this.queue._addJob({ method: 'verify', params: [] });

    // 1. define trust model
    // await this.server.trust(this.fabric);
    // 2. wait for local node
    // await this.fabric.start();
    // 3. start the interface
    await this.server.start();

    // set status...
    this.status = 'started';

    // commit to change
    this.commit();

    // emit ready event
    this.emit('ready');

    // return the instance!
    return this;
  }

  /**
   * Stop the process.
   * @return {Promise} Resolves once the process has been stopped.
   */
  async stop () {
    this.status = 'stopping';
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

  async _handleTrustedLog (message) {
    this.emit('log', `[types/sensemaker] Trusted Source emitted log: ${message}`);
  }

  async _handleTrustedMessage (message) {
    this.emit('log', `[types/sensemaker] Trusted Source emitted message: ${message}`);
    this.emit('message', message);
  }

  async _handleTrustedWarning (message) {
    this.emit('warning', `[types/sensemaker] Trusted Source emitted warning: ${message}`);
  }

  async _handleTrustedError (message) {
    this.emit('error', `[types/sensemaker] Trusted Source emitted error: ${message}`);
  }
}

module.exports = Sensemaker;
