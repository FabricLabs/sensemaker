'use strict';

// Fabric Core
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

// Fabric HTTP
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

  get documents () {
    return Object.values(this.state.collections.documents);
  }

  get courts () {
    return Object.values(this.state.collections.courts);
  }

  async enumerateDocuments () {
    this.emit('debug', 'Enumerating documents...');
    return [];
  }

  async search (request) {
    this.emit('debug', 'Searching...');
    let results = [];

    for (let i = 0; i < this.remotes.length; i++) {
      const remote = this.remotes[i];
      const index = await remote._SEARCH('/', request);
      console.debug('[FABRIC] Search results (index):', index.results);

      const response = await remote._SEARCH('/services/courtlistener/cases', request);
      console.debug('[FABRIC] Search results (CourtListener cases):', response.results);

      results = results.concat(response.results);
    }

    return results;
  }

  async sync () {
    this.emit('debug', 'Syncing...');

    // For each Remote, synchronize documents
    for (let i = 0; i < this.remotes.length; i++) {
      const remote = this.remotes[i];

      // Documents
      await Promise.allSettled([
        this.syncRemoteDocuments(remote),
        // this.syncRemoteCases(remote),
        this.syncRemoteCourts(remote)
      ]);
    }

    this.commit();

    return this;
  }

  async syncRemoteDocuments (remote) {
    try {
      const documents = await remote._GET('/documents');
      console.debug('[FABRIC] Remote Documents found:', documents);
      for (let j = 0; j < documents.length; j++) {
        const document = documents[j];
        this._state.content.collections.documents[document.id] = document;
      }
    } catch (exception) {
      console.error('[FABRIC] Could not fetch documents:', exception);
    }

    this.commit();
  }

  async syncRemoteCases (remote) {
    try {
      const cases = await remote._GET('/cases');
      console.debug('[FABRIC] Remote Cases found:', cases.length);
      for (let j = 0; j < cases.length; j++) {
        const court = cases[j];
        if (court.harvard_case_law_id) {
          const actor = new Actor({ name: `harvard/cases/${court.harvard_case_law_id}` });
          this._state.content.collections.cases[actor.id] = court;
        }
      }
    } catch (exception) {
      console.error('[FABRIC] Could not fetch courts:', exception);
    }

    this.commit();
  }

  async syncRemoteCourts (remote) {
    try {
      const courts = await remote._GET('/courts');
      console.debug('[FABRIC] Remote Courts found:', courts.length);
      for (let j = 0; j < courts.length; j++) {
        const court = courts[j];
        const actor = new Actor({ name: `courtlistener/courts/${court.slug}` });
        this._state.content.collections.courts[actor.id] = court;
      }
    } catch (exception) {
      console.error('[FABRIC] Could not fetch courts:', exception);
    }

    this.commit();
  }

  async start () {
    this.emit('debug', '[FABRIC] Starting service...');

    // Sync
    await this.sync();

    return this;
  }

  commit () {
    super.commit();

    for (let i = 0; i < this.courts.length; i++) {
      const court = this.courts[i];
      const actor = new Actor({ name: `courtlistener/courts/${court.slug}` });

      // Fabric
      court.id = actor.id;
      court.ids = {};

      if (court.courtlistener_id) court.ids.courtlistener = court.courtlistener_id;

      this.emit('court', court);
    }
  }
}

module.exports = FabricService;
