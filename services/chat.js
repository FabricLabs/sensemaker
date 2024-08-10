'use strict';

// Fabric Types
const Service = require('@fabric/core/types/service');

// Fabric HTTP
const HTTPServer = require('@fabric/http/types/server');

// Networks
const Matrix = require('@fabric/matrix');

// Integrations
const OpenAI = require('./openai');

/**
 * Implements a chat coordinator.
 */
class Chat extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      http: {
        interface: '0.0.0.0',
        hostname: 'localhost',
        port: 7778
      },
      matrix: {
        alias: 'sensemaker',
        homeserver: 'https://fabric.pub',
        coordinator: '!pPjIUAOkwmgXeICrzT:fabric.pub',
        trigger: '!',
        username: 'sensemaker',
        password: 'w0ppled00p'
      },
      state: {
        status: 'PAUSED'
      }
    }, settings);

    // Core services
    this.http = new HTTPServer(this.settings.http);
    this.http.on('log', this._handleHTTPLog.bind(this));

    this.matrix = new Matrix(this.settings.matrix);

    // Integrations
    this.openai = new OpenAI(this.settings.openai);

    this._state = {
      content: this.settings.state
    };

    return this;
  }

  async start () {
    this.matrix.on('debug', (msg) => {
      console.debug('[SENSEMAKER:MATRIX]', 'Debug:', msg);
    });

    this.matrix.on('error', (msg) => {
      console.error('[SENSEMAKER:MATRIX]', 'Error:', msg);
    });

    this.matrix.on('log', (msg) => {
      console.log('[SENSEMAKER:MATRIX]', 'Log:', msg);
    });

    await this.http.start();
    await this.matrix.start();

    await this.openai.start();

    return this;
  }

  async stop () {
    await this.matrix.stop();
    await this.http.stop();

    return this;
  }

  _handleHTTPLog (message) {
    this.emit('log', `HTTP Log: ${message}`);
  }
}

module.exports = Chat;
