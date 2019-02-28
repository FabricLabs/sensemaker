'use strict';

const Fabric = require('@fabric/core');
const Server = require('@fabric/http');
const Source = require('./source');

/**
 * Sensemaker is a Fabric-powered application, capable of running autonomously
 * once started by the user.  By default, earnings are enabled.
 * @type {Object}
 */
class Sensemaker extends Fabric.App {
  /**
   * Constructor for the Sensemaker application.
   * @param  {Object} [settings={}] Map of configuration values.
   * @return {Sensemaker}           Instance of Sensemaker.
   */
  constructor (settings = {}) {
    super(settings);
    this.config = settings;
    this.fabric = new Fabric(settings);
    this.server = new Server(settings);
  }

  /**
   * Explicitly trust all events from a known source.
   * @param  {EventEmitter} source Emitter of events.
   * @return {Sensemaker}          Instance of Sensemaker after binding events.
   */
  trust (source) {
    source.on('message', this._handleMessage.bind(this));
  }

  async _handleMessage (message) {
    console.log('[types/sensemaker]', 'received message:', message);
  }

  /**
   * Start the process.
   * @return {Promise} Resolves once the process has been started.
   */
  async start () {
    // TODO: remove try/catch
    try {
      // TODO: use `fabric.bootstrap`
      await this.fabric.define('Source', Source);

      // 0. load services
      // TODO: automate this
      let Twitter = require('../services/twitter');
      this.twitter = new Twitter(this.config.settings['services/twitter']);

      // 1. define trust model
      await this.server.trust(this.fabric);
      // 2. wait for local node
      await this.fabric.start();
      // 3. start the interface
      await this.server.start();

      // set status...
      this.status = 'started';

      // commit to change
      this.commit();
      // emit ready event
      this.emit('ready');
    } catch (E) {
      console.log('failed to start:', E);
    }

    // return the instance!
    return this;
  }

  /**
   * Stop the process.
   * @return {Promise} Resolves once the process has been stopped.
   */
  async stop () {
    this.status = 'stopping';
    await this.fabric.stop();
    this.status = 'stopped';
    this.commit();
    this.emit('stopped');
    return this;
  }
}

module.exports = Sensemaker;
