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

  async allCases (url = 'https://api.case.law/v1/cases/?page_size=1000') {
    this.emit('debug', 'Enumerating cases...');
    const cases = await fetch(url);
    const object = await cases.json();

    let results = object.results;

    if (object.next) {
      results = results.concat(await this.deepFetch(object.next));
    }

    return results;
  }

  async allCourts (url = 'https://api.case.law/v1/courts/?page_size=1000') {
    this.emit('debug', 'Enumerating courts...');
    const courts = await fetch(url);
    const object = await courts.json();

    let results = object.results;

    if (object.next) {
      results = results.concat(await this.deepFetch(object.next));
    }

    return results;
  }

  async deepFetch (url) {
    if (!url) return [];

    const response = await fetch(url);
    const object = await response.json();

    let results = object.results;

    if (object.next) {
      results = results.concat(await this.deepFetch(object.next));
    }

    return results;
  }

  async enumerateCases () {
    return this.allCases();
  }

  async enumerateCourts () {
    this.emit('debug', 'Enumerating courts...');
    const courts = await this.allCourts();
    // console.debug('[HARVARD]', 'ENUMERATED COURTS:', courts);
    return courts;
  }

  async sampleCases () {
    this.emit('debug', 'Sampling cases...');
    const cases = await fetch('https://api.case.law/v1/cases?full_case=true&ordering=random');
    console.debug('[HARVARD]', 'SAMPLED CASES:', cases);
    return cases;
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
      const courts = await this.enumerateCourts();

      // Tracking
      const end = Date.now();
      this.emit('debug', 'Counted in', end - now, 'ms.');

      // Return counts
      return {
        courts: courts?.length || 0
      };
    } catch (exception) {
      this.emit('error', exception);
      return null;
    }
  }

  async syncCases () {
    // TODO: this should be a stream
    const cases = await this.enumerateCases();

    for (let i = 0; i < cases.length; i++) {
      const court = cases[i];
      this.emit('court', court);
    }

    return cases;
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
      this.syncCases()
      // this.syncDockets(),
      // this.syncRecapDocuments()
    ]);
  }

  async sync () {
    return new Promise(async (resolve, reject) => {
      console.debug('[HARVARD]', 'Syncing...');
      this._state.content.status = 'SYNCING';

      // Estimate Work
      const counts = await this.getCounts();
      this.emit('debug', '[HARVARD]', 'Counts:', counts);
      this._state.content.counts = Object.assign(this._state.content.counts, counts);
  
      // Sync Data Sources
      // TODO: Dockets
      // Courts
      this.syncCourts().then((results) => {
        console.debug('[HARVARD] Courts found:', results);

        this._state.content.status = 'SYNCED';
        this.commit();
    
        // EMIT SYNC EVENT
        this.emit('sync', {
          type: 'Sync',
          state: this.state
        });
    
        console.debug('[HARVARD]', 'Sync complete!');
        resolve();
      }).catch(reject);
    });
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
