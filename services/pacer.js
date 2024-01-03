'use strict';

const Service = require('@fabric/core/types/service');

class PACER extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'PACER',
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

    this._state = {
      content: this.settings.state
    };

    return this;
  }

  async allCourts () {
    return new Promise((resolve, reject) => {
      fetch('https://pacer.uscourts.gov/file-case/court-cmecf-lookup/data.json').then(async (results) => {
        const object = await results.json();
        if (!object || !object.data) return reject(new Error('No data found in response.'));
        resolve(object.data);
      }).catch(reject);
    });
  }

  async getCounts () {
    const courts = await this.syncCourts();

    return {
      courts: courts.length
    };
  }

  async syncCourts () {
    const courts = await this.allCourts();

    for (let court of courts || []) {
      court.id = court.court_id;
      this._state.content.collections.courts[court.court_id] = court;
      this.emit('court', court);
    }

    this.commit();

    return courts;
  }

  async start () {
    const counts = await this.getCounts();
    this.emit('debug', `Found ${counts.courts} courts.`);
    this.commit();
    return this;
  }
}

module.exports = PACER;
