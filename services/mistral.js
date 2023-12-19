'use strict';

// Constants
const {
  RELEASE_NAME
} = require('../constants');

const Peer = require('@fabric/core/types/peer');
const Service = require('@fabric/core/types/service');
const HTTPClient = require('@fabric/http/types/client');

/**
 * HTTP-based Mistral client.
 * @type {Mistral}
 * @extends Service
 * @property {Object} settings
 * @property {Peer} fabric The Fabric Core peer.
 * @property {HTTPClient} remote The Mistral remote.
 * @property {Object} engine The Mistral engine.
 * @property {Object} state The Mistral state.
 */
class Mistral extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'mistral',
      description: 'A service for interacting with a Mistral-based AI.',
      authority: 'https://mistral.on.fabric.pub',
      version: RELEASE_NAME
    }, settings);

    this.fabric = new Peer({
      name: 'Fabric Core',
      host: 'localhost',
      port: 7777
    });

    return this;
  }

  async start () {
    await super.start();

    this.fabric.on('debug', (...msg) => {
      console.debug('[MISTRAL]', '[DEBUG]', ...msg);
    });

    // Once Fabric is ready, start Mistral.
    this.fabric.on('ready', () => {
      console.log('[MISTRAL] Fabric Core is ready.');

      // Start Mistral.
      this.remote = new HTTPClient({
        name: 'Mistral',
        host: this.settings.authority,
        port: 443,
        secure: true
      });
      // this.engine = this.remote

      // Assert that Mistral is ready.
      this.emit('ready');
    });

    // Start Fabric Core.
    this.fabric.start();

    return this;
  }

  stop () {
    super.stop();

    return this;
  }
}

module.exports = Mistral;
