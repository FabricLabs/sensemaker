'use strict';

const Service = require('@fabric/core/types/service');
const Remote = require('@fabric/http/types/remote');

class FabricService extends Service {
  constructor (settings = {}) {
    super(settings);

    // Settings
    this.settings = Object.assign({
      name: 'Fabric',
      remotes: [
        { host: 'hub.fabric.pub', port: 443, secure: true },
        { host: 'beta.jeeves.dev', port: 443, secure: true }
      ],
      state: {
        content: {
          status: 'INITIALIZED',
          collections: {
            documents: {}
          },
          counts: {
            documents: 0
          }
        }
      }
    }, settings);

    // Set up remotes
    this.remotes = this.settings.remotes.map(remote => new Remote(remote));

    // State
    this._state = {
      content: this.settings.state
    };

    return this;
  }

  async enumerateDocuments () {
    this.emit('debug', 'Enumerating documents...');
    return [];
  }

  async sync () {
    this.emit('debug', 'Syncing...');

    for (let i = 0; i < this.remotes.length; i++) {
      // console.debug('[FABRIC] Remote Settings:', this.remotes[i].settings);
      const remote = this.remotes[i];
      const documents = await remote._GET('/documents');
      // console.debug('[FABRIC] Documents found:', documents);
    }

    return this;
  }

  async start () {
    this.emit('debug', '[FABRIC] Starting service...');
    await this.sync();
    return this;
  }
}

module.exports = FabricService;
