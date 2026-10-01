'use strict';

// Dependencies
const Actor = require('@fabric/core/types/actor');
const Peer = require('@fabric/core/types/peer');
const Remote = require('@fabric/http/types/remote');
const FabricHub = require('@fabric/hub/services/fabric');

/**
 * Defines the Fabric interface for Sensemaker.
 * Extends Hub `services/fabric` via package export (no path.join deep-require).
 */
class FabricNetwork extends FabricHub {
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
        { host: 'hub.fabric.pub', port: 443, secure: true }
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

    // Internals
    this.agent = new Peer(this.settings);
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

  async enumerateDocuments () {
    this.emit('debug', 'Enumerating documents...');
    return [];
  }

  async search (request) {
    if (!this.settings.search) return [];

    // Begin Search
    this.emit('debug', 'Searching...', request);
    const results = [];

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
      } catch (exception) {
        console.error('[FABRIC] Could not search index:', exception);
      }
    }

    return results;
  }

  async sync () {
    if (!this.settings.sync) return this;
    this.emit('debug', 'Syncing...');

    for (let i = 0; i < this.remotes.length; i++) {
      const remote = this.remotes[i];
      await Promise.allSettled([
        this.syncRemoteDocuments(remote)
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
        this.emit('document', document);
      }
    } catch (exception) {
      console.error('[FABRIC] Could not fetch documents:', exception);
    }

    this.commit();
  }

  async start () {
    this.emit('debug', '[FABRIC] Starting service...');

    await this.sync();
    await this.agent.start();

    return this;
  }

  async stop () {
    this.emit('debug', '[FABRIC] Stopping service...');
    await this.agent.stop();
    return this;
  }

  /**
   * Outbound P2P dial (host:port or pubkey@host:port). Delegates to the Fabric {@link Peer}.
   * @param {string} target
   */
  _connect (target) {
    if (!this.agent || typeof this.agent._connect !== 'function') {
      throw new Error('Fabric peer agent is not available.');
    }
    return this.agent._connect(target);
  }

  commit () {
    super.commit();

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
    });
  }
}

module.exports = FabricNetwork;
