'use strict';

// Dependencies
const merge = require('lodash.merge');

// Fabric Types
const App = require('@fabric/core/types/app');
const Queue = require('@fabric/core/types/queue');
const Worker = require('@fabric/core/types/worker');

// HTTP
const Server = require('@fabric/http/types/server');

// Sources
const Matrix = require('@fabric/matrix');
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
      workers: 1
    }, settings);

    this.queue = new Queue(this.settings);
    this.server = new Server(this.settings);
    this.sources = {};
    this.workers = [];

    this._state = {
      status: 'ready',
      actors: {},
      messages: {},
      objects: {}
    };

    return this;
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

  /**
   * Start the process.
   * @return {Promise} Resolves once the process has been started.
   */
  async start () {
    this._registerService('matrix', Matrix);
    this._registerService('twilio', Twilio);
    this._registerService('twitter', Twitter);

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
