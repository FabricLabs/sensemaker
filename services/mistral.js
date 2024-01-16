'use strict';

// Constants
const {
  RELEASE_NAME,
  AGENT_MAX_TOKENS
} = require('../constants');

// Dependencies
const fetch = require('cross-fetch');

// Types
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
      authority: 'https://api.mistral.ai',
      // model: '',
      version: RELEASE_NAME
    }, settings);

    this.fabric = new Peer({
      name: 'Fabric Core',
      host: 'localhost',
      port: 7777
    });

    return this;
  }

  async _streamConversationRequest (request) {
    return new Promise(async (resolve, reject) => {
      const entropy = request.entropy || 0.0;
      const seed = new Actor({ name: `entropies/${entropy + ''}` });
      const message = (request.message_id) ? { id: request.message_id } : { id: seed.id };

      const result = await fetch(`${this.settings.authority}/v1/completions`, {
        method: 'POST',
        body: JSON.stringify({
          max_tokens: AGENT_MAX_TOKENS,
          messages: request.messages,
          model: this.settings.model
        })
      });

      console.debug('[MISTRAL] COMPLETION RESULT:', result);

      // Notify the message is complete
      this.emit('MessageEnd', message);
      resolve(message);
    });
  }

  async query (request) {
    return new Promise(async (resolve, reject) => {
      const result = await fetch(`${this.settings.authority}/v1/completions`, {
        method: 'POST',
        body: JSON.stringify({
          max_tokens: AGENT_MAX_TOKENS,
          messages: request.messages,
          model: this.settings.model
        })
      });

      const object = await result.json();
      console.debug('RESULT:', object);

      resolve(object);
    });
  }

  async start () {
    // await super.start();

    this.fabric.on('debug', (...msg) => {
      console.debug('[MISTRAL]', '[DEBUG]', ...msg);
    });

    // Once Fabric is ready, start Mistral.
    this.fabric.on('ready', () => {
      console.log('[MISTRAL] Fabric Core is ready.');

      // Assert that Mistral is ready.
      this.emit('ready');
    });

    // Start Fabric Core.
    this.fabric.start();

    return this;
  }

  async stop () {
    super.stop();

    return this;
  }
}

module.exports = Mistral;
