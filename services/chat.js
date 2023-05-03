'use strict';

const Service = require('@fabric/core/types/service');
const HTTPServer = require('@fabric/http/types/server');

const OpenAI = require('./openai');

class Chat extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      http: {
        interface: '0.0.0.0',
        hostname: 'localhost',
        port: 7778
      },
      state: {
        status: 'PAUSED'
      }
    }, settings);

    this.http = new HTTPServer(this.settings.http);
    this.http.on('log', this._handleHTTPLog.bind(this));

    this.openai = new OpenAI(this.settings.openai);

    this._state = {
      content: this.settings.state
    };

    return this;
  }

  async start () {
    await this.http.start();
    await this.openai.start();

    return this;
  }

  async stop () {
    await this.http.stop();
    return this;
  }

  _handleHTTPLog (message) {
    this.emit('log', `HTTP Log: ${message}`);
  }
}

module.exports = Chat;
