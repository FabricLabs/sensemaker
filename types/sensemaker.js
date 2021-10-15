'use strict';

const merge = require('lodash.merge');

const App = require('@fabric/core/types/app');
const Server = require('@fabric/http/types/server');

const Source = require('./source');
const Twitter = require('../services/twitter');

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
      }
    }, settings);

    this.server = new Server(this.settings);
    this.sources = {};

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

  /**
   * Start the process.
   * @return {Promise} Resolves once the process has been started.
   */
  async start () {
    this.twitter = new Twitter(this.settings.twitter);

    // 1. define trust model
    // await this.server.trust(this.fabric);
    // 2. wait for local node
    // await this.fabric.start();
    // 3. start the interface
    await this.server.start();

    // Start services
    await this.twitter.start();

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
}

module.exports = Sensemaker;
