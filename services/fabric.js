'use strict';

const Actor = require('@fabric/core/types/actor');
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
        status: 'INITIALIZED',
        collections: {
          courts: {},
          documents: {}
        },
        counts: {
          courts: 0,
          documents: 0
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

      // Documents
      const documents = await remote._GET('/documents');
      // console.debug('[FABRIC] Documents found:', documents);
      for (let j = 0; j < documents.length; j++) {
        const document = documents[j];
        this._state.content.collections.documents[document.id] = document;
      }

      // Courts
      const courts = await remote._GET('/courts');
      // console.debug('[FABRIC] Courts found:', courts);
      for (let j = 0; j < courts.length; j++) {
        const court = courts[j];
        const actor = new Actor({ name: `courtlistener/courts/${court.slug}` });
        this._state.content.collections.courts[actor.id] = court;
      }
    }

    this.commit();

    return this;
  }

  async start () {
    this.emit('debug', '[FABRIC] Starting service...');

    // Sync
    await this.sync();

    return this;
  }
}

module.exports = FabricService;
