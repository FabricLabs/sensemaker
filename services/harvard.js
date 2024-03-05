'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../constants');

// Local Constants
const API_PAGE_LIMIT = 1000;

// Dependencies
const fetch = require('cross-fetch');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

class Harvard extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'Harvard',
      collections: ['cases', 'courts', 'documents', 'jurisdictions', 'reporters', 'volumes']
    }, settings);

    this.actor = new Actor({ name: 'Harvard' });

    this._state = {
      content: {
        actor: this.actor.id,
        status: 'INITIALIZED',
        collections: {
          cases: {},
          courts: {},
          documents: {},
          jurisdictions: {},
          reporters: {},
          volumes: {}
        },
        counts: {
          cases: 0,
          courts: 0,
          documents: 0,
          jurisdictions: 0,
          reporters: 0,
          volumes: 0
        }
      }
    };

    return this;
  }

  async allCases (url = `https://api.case.law/v1/cases/?page_size=${API_PAGE_LIMIT}`) {
    this.emit('debug', 'Fetching all cases...');
    const cases = await fetch(url);
    const object = await cases.json();

    let results = object.results;

    if (object.next) {
      results = results.concat(await this.deepFetch(object.next));
    }

    return results;
  }

  async allCourts (url = `https://api.case.law/v1/courts/?page_size=${API_PAGE_LIMIT}`) {
    this.emit('debug', 'Fetching all courts...');
    const courts = await fetch(url);
    const object = await courts.json();

    let results = object.results;

    if (object.next) {
      results = results.concat(await this.deepFetch(object.next));
    }

    this.emit('debug', 'Fetched all courts!');

    return results;
  }

  async allJurisdictions (url = `https://api.case.law/v1/jurisdictions/?page_size=${API_PAGE_LIMIT}`) {
    this.emit('debug', 'Fetching all jurisdictions...');
    const jurisdictions = await fetch(url);
    const object = await jurisdictions.json();

    let results = object.results;

    if (object.next) {
      results = results.concat(await this.deepFetch(object.next));
    }

    this.emit('debug', 'Fetched all jurisdictions!');

    return results;
  }

  async allReporters (url = `https://api.case.law/v1/reporters/?page_size=${API_PAGE_LIMIT}`) {
    this.emit('debug', 'Fetching all reporters...');
    const reporters = await fetch(url);
    const object = await reporters.json();

    let results = object.results;

    if (object.next) {
      results = results.concat(await this.deepFetch(object.next));
    }

    this.emit('debug', 'Fetched all reporters!');

    return results;
  }

  async allVolumes (url = `https://api.case.law/v1/volumes/?page_size=${API_PAGE_LIMIT}`) {
    this.emit('debug', 'Fetching all volumes...');
    const volumes = await fetch(url);
    const object = await volumes.json();

    let results = object.results;

    if (object.next) {
      results = results.concat(await this.deepFetch(object.next));
    }

    this.emit('debug', 'Fetched all volumes!');

    return results;
  }

  async deepFetch (url) {
    if (!url) return [];

    // console.debug('[HARVARD]', 'Deep fetching:', url);

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
    return courts;
  }

  async enumerateJurisdictions () {
    this.emit('debug', 'Enumerating jurisdictions...');
    const jurisdictions = await this.allJurisdictions();
    return jurisdictions;
  }

  async enumerateReporters () {
    this.emit('debug', 'Enumerating reporters...');
    const reporters = await this.allReporters();
    return reporters;
  }

  async enumerateVolumes () {
    this.emit('debug', 'Enumerating volumes...');
    const volumes = await this.allVolumes();
    return volumes;
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

  async getCaseByID (id) {
    const instance = await fetch(`https://api.case.law/v1/cases/${id}?full_case=true`);
    return instance.json();
  }

  async getJurisdictionByID (id) {
    return this.state.collections.jurisdictions[id];
  }

  async getJurisdictionBySlug (slug) {
    const result = await fetch(`https://api.case.law/v1/jurisdictions/${slug}/`);
    const object = await result.json();
    return object;
  }

  async getCounts () {
    try {
      // Tracking
      const now = Date.now();

      // TODO: these should be async streams
      // const cases = await this.enumerateCases();
      const cases = [];
      const jurisdictions = await this.syncJurisdictions();
      // const volumes = await this.syncVolumes();
      const volumes = [];
      const courts = await this.syncCourts();
      const reporters = await this.syncReporters();

      // Tracking
      const end = Date.now();
      this.emit('debug', 'Counted in', end - now, 'ms.');

      // Return counts
      return {
        cases: cases?.length || 0,
        courts: courts?.length || 0,
        jurisdictions: jurisdictions?.length || 0,
        reporters: reporters?.length || 0,
        volumes: volumes?.length || 0
      };
    } catch (exception) {
      this.emit('error', exception);
      return null;
    }
  }

  async getStats () {
    const json = JSON.stringify(this.state);

    return {
      fabric: {
        serialization: json.length
      }
    }
  }

  async search (request) {
    return new Promise(async (resolve, reject) => {
      fetch(`https://api.case.law/v1/cases/?search=${request.query}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': (this.settings.token) ? `Bearer ${this.settings.token}` : undefined,
          'Content-Type': 'application/json'
        }
      }).then(async (response) => {
        resolve(await response.json());
      }).catch(reject);
    });
  }

  async searchCases (request) {
    return new Promise(async (resolve, reject) => {
      fetch(`https://api.case.law/v1/cases/?search=${request.query}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': (this.settings.token) ? `Bearer ${this.settings.token}` : undefined,
          'Content-Type': 'application/json'
        }
      }).then(async (response) => {
        resolve(await response.json());
      }).catch(reject);
    });
  }

  async syncCases () {
    // TODO: this should be a stream
    const cases = await this.enumerateCases();

    for (let i = 0; i < cases.length; i++) {
      const instance = cases[i];
      this._state.content.cases[instance.id] = instance;
      this.emit('case', instance);
    }

    return cases;
  }

  async syncCourtBySlug (slug) {
    const response = await fetch(`https://api.case.law/v1/courts/${slug}/`);
    const object = await response.json();
    this._state.content.collections.courts[object.id] = object;
    this.emit('court', object);
    return object;
  }

  async syncCourts () {
    // TODO: this should be a stream
    const courts = await this.enumerateCourts();

    for (let i = 0; i < courts.length; i++) {
      const court = courts[i];
      this._state.content.collections.courts[court.id] = court;
      this.emit('court', court);
    }

    return courts;
  }

  async syncJurisdictions () {
    // TODO: this should be a stream
    const jurisdictions = await this.enumerateJurisdictions();

    for (let i = 0; i < jurisdictions.length; i++) {
      const jurisdiction = jurisdictions[i];
      this._state.content.collections.jurisdictions[jurisdiction.id] = jurisdiction;
      this.emit('jurisdiction', jurisdiction);
    }

    return jurisdictions;
  }

  async syncJurisdictionBySlug (slug) {
    const jurisdiction = await this.getJurisdictionBySlug(slug);

    if (!jurisdiction) {
      const response = await fetch(`https://api.case.law/v1/jurisdictions/${slug}/`);
      const object = await response.json();
      this._state.content.collections.jurisdictions[object.id] = object;
      this.emit('jurisdiction', object);
    }

    return jurisdiction;
  }

  async syncReporters () {
    // TODO: this should be a stream
    const reporters = await this.enumerateReporters();

    for (let i = 0; i < reporters.length; i++) {
      const reporter = reporters[i];
      this._state.content.collections.reporters[reporter.id] = reporter;

      /* const jurisdictions = await Promise.all(reporter.jurisdictions.map(async (jurisdiction) => {
        console.debug('getting jurisdiction:', jurisdiction.id);
        return this.getJurisdictionByID(jurisdiction.id);
      })); */

      // console.debug('mapped jurisdictions:', jurisdictions);

      this.emit('reporter', reporter);
    }

    return reporters;
  }

  async syncVolumes () {
    // TODO: this should be a stream
    const volumes = await this.enumerateVolumes();

    for (let i = 0; i < volumes.length; i++) {
      const volume = volumes[i];
      volume.id = volume.barcode;
      this._state.content.collections.volumes[volume.id] = volume;
      this.emit('volume', volume);
    }

    return volumes;
  }

  async sync () {
    return new Promise(async (resolve, reject) => {
      console.debug('[HARVARD]', 'Syncing...');
      this._state.content.status = 'SYNCING';

      // Estimate Work
      const counts = await this.getCounts();
      const stats = await this.getStats();

      this.emit('debug', '[HARVARD]', 'Counts:', counts);
      this.emit('debug', '[HARVARD]', 'Stats:', stats);

      this._state.content.counts = Object.assign(this._state.content.counts, counts);

      this._state.content.status = 'SYNCED';
      this.commit();
  
      // EMIT SYNC EVENT
      this.emit('sync', {
        type: 'Sync',
        state: this.state
      });
  
      console.debug('[HARVARD]', 'Sync complete!');
      resolve();
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
