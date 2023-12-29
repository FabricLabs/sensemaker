'use strict';

const {
  PER_PAGE_LIMIT
} = require('../constants');

const knex = require('knex');

const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

class Harvard extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'Harvard'
    }, settings);

    this._state = {
      content: {
        status: 'INITIALIZED',
        collections: {
          documents: {}
        },
        counts: {
          cases: 0,
          citations: 0,
          courts: 0
        }
      }
    };

    return this;
  }

  async enumerateCourts () {
    this.emit('debug', 'Enumerating courts...');
    const courts = await fetch('https://api.case.law/v1/courts');
    const object = await courts.json();
    // console.debug('[HARVARD]', 'ENUMERATED COURTS:', object.results);
    return object.results;
  }

  async sampleCourts () {
    this.emit('debug', 'Sampling courts...');
    const courts = await fetch('https://api.case.law/v1/courts?&ordering=random');
    console.debug('[HARVARD]', 'SAMPLED COURTS:', courts);
    return courts;
  }

  async streamCourts (handler) {
    const stream = null;
    return stream;
  }

  async query (table) {
    return this.db(table);
  }

  async getCounts () {
    try {
      // Tracking
      const now = Date.now();

      // TODO: these should be async streams
      // const courtCount = await this.db('search_court').count();

      // Tracking
      const end = Date.now();
      this.emit('debug', 'Counted in', end - now, 'ms.');

      // Return counts
      return {
        // courts: courtCount[0].count
        courts: 0
      };
    } catch (exception) {
      this.emit('error', exception);
      return null;
    }
  }

  async syncCourts () {
    // TODO: this should be a stream
    const courts = await this.enumerateCourts();

    for (let i = 0; i < courts.length; i++) {
      const court = courts[i];
      this.emit('court', court);
    }

    return courts;
  }

  async syncSamples () {
    // Sync courts first
    await this.syncCourts();

    // Then for all parallel jobs...
    return Promise.all([
      // this.syncDockets(),
      // this.syncRecapDocuments()
    ]);
  }

  async sync () {
    console.debug('[HARVARD]', 'Syncing...');
    this._state.content.status = 'SYNCING';

    // Estimate Work
    // const counts = await this.getCounts();
    // this.emit('debug', '[HARVARD]', 'Counts:', counts);
    // this._state.content.counts = Object.assign(this._state.content.counts, counts);

    // Sync Data Sources
    // TODO: Dockets
    // Courts
    await this.syncCourts();

    this._state.content.status = 'SYNCED';
    this.commit();

    // EMIT SYNC EVENT
    this.emit('sync', {
      type: 'Sync',
      state: this.state
    });

    console.debug('[HARVARD]', 'Sync complete!');
  }

  async start () {
    console.log('[HARVARD]', 'Starting...');

    // Begin syncing
    this.sync().then(() => {
      this._state.content.status = 'SYNCED';
      this.emit('ready');
    }).catch((exception) => {
      this.emit('debug', '[HARVARD]', 'Exception:', exception);
    });

    return this;
  }
}

module.exports = Harvard;
