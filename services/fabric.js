'use strict';

// Fabric Core
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

// Fabric HTTP
const Remote = require('@fabric/http/types/remote');

/**
 * Defines the Fabric interface for Sensemaker.
 */
class FabricService extends Service {
  /**
   * Create an instance of the service.
   * @param {Object} [settings] Settings for the service.
   * @returns {FabricService} A new instance of the service.
   */
  constructor (settings = {}) {
    super(settings);

    // Settings
    this.settings = Object.assign({
      name: 'Fabric',
      remotes: [
        { host: 'sensemaker.io', port: 443, secure: true },
        { host: 'hub.fabric.pub', port: 443, secure: true },
        { host: 'beta.jeeves.dev', port: 443, secure: true }
      ],
      state: {
        status: 'INITIALIZED',
        collections: {
          documents: {},
          people: {}
        },
        counts: {
          documents: 0,
          people: 0
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

  get people () {
    return Object.values(this.state.collections.people);
  }

  async enumerateDocuments () {
    this.emit('debug', 'Enumerating documents...');
    return [];
  }

  async search (request) {
    if (!this.settings.search) return [];

    // Begin Search
    this.emit('debug', 'Searching...', request);
    let results = [];

    for (let i = 0; i < this.remotes.length; i++) {
      try {
        const remote = this.remotes[i];
        const index = await remote._SEARCH('/', { body: request });
        console.debug(`[FABRIC] Search results (index) [${remote.settings.host}]:`, index);

        if (index) {
          switch (index.code) {
            default:
              console.debug('[FABRIC] [SEARCH] Unhandled response code:', index.code);
              break;
            case 400:
            case 502:
              console.error('[FABRIC] Could not search index:', index);
              break;
          }
        }
        // results = results.concat(index.results);
      } catch (exception) {
        console.error('[FABRIC] Could not search index:', exception);
      }
    }

    return results;
  }

  async sync () {
    if (!this.settings.sync) return this;

    this.emit('debug', 'Syncing...');

    // For each Remote, synchronize documents
    for (let i = 0; i < this.remotes.length; i++) {
      const remote = this.remotes[i];

      // Documents
      await Promise.allSettled([
        this.syncRemoteDocuments(remote),
        // this.syncRemoteCases(remote),
        this.syncRemoteCourts(remote),
        this.syncRemotePeople(remote)
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
        // TODO: validate documents
        // TODO: decide inner Fabric state vs. standard document content
        this._state.content.collections.documents[document.id] = document;
        this.emit('document', document);
      }
    } catch (exception) {
      console.error('[FABRIC] Could not fetch documents:', exception);
    }

    console.debug('[FABRIC] Beginning experimental CourtListener sync...');
    try {
      const documents = await remote._GET('/services/courtlistener/recapdocuments');
      for (let j = 0; j < documents.length; j++) {
        const document = documents[j];
        const actor = new Actor({ name: `courtlistener/documents/${document.id}` });
        const instance = {
          id: actor.id,
          sha1: document.sha1,
          page_count: document.page_count,
          description: document.description,
          created: document.date_created,
          modified: document.date_modified,
          title: document.title,
          content: plain_text,
          pacer_id: document.pacer_doc_id,
          courtlistener_filepath: document.filepath_local,
          internetarchive_filepath: document.filepath_ia,
          is_free_on_pacer: document.is_free_on_pacer
        };

        this._state.content.collections.documents[instance.id] = instance;
        this.emit('document', instance);
      }
      console.debug('[FABRIC] [SERVICES/CL] Remote Documents found:', documents);
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
        const instance = cases[j];
        if (instance.harvard_case_law_id) {
          const actor = new Actor({ name: `harvard/cases/${instance.harvard_case_law_id}` });
          instance.id = actor.id;
          this._state.content.collections.cases[actor.id] = instance;
          this.emit('case', instance);
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
      console.debug('[FABRIC] Remote Court sample:', courts[0]);
      for (let j = 0; j < courts.length; j++) {
        const court = courts[j];

        // Capture CourtListener courts
        if (court.courtlistener_id) {
          const actor = new Actor({ name: `courtlistener/courts/${court.slug}` });
          court.id = actor.id;
          this._state.content.collections.courts[actor.id] = court;
          this.emit('court', court);
        }
      }
    } catch (exception) {
      console.error('[FABRIC] Could not fetch courts:', exception);
    }

    this.commit();
  }

  async syncRemotePeople (remote) {
    // Stores people by remote ID, not Fabric ID (should be Fabric ID already)
    try {
      const people = await remote._GET('/people');
      console.debug('[FABRIC] Remote People found:', people.length);
      console.debug('[FABRIC] Remote Person sample:', people[0]);

      for (let j = 0; j < people.length; j++) {
        const person = people[j];

        // Store external IDs
        person.ids = {};
        if (person.courtlistener_id) people.ids.courtlistener = person.courtlistener_id;

        // Store in state
        this._state.content.collections.people[person.id] = person;

        // Emit event
        this.emit('person', person);
      }
    } catch (exception) {
      console.error('[FABRIC] Could not fetch people:', exception);
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

    // Commit to state
    const commit = new Actor({
      content: {
        state: this.state
      }
    });

    this.emit('commit', {
      id: commit.id,
      type: 'Commit',
      content: {
        state: this.state
      }
    })
  }
}

module.exports = FabricService;
