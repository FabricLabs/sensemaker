'use strict';

const knex = require('knex');

const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

class CourtListener extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'CourtListener'
    }, settings);

    this.db = knex({
      client: 'postgresql',
      connection: {
        host: this.settings.host,
        port: this.settings.port,
        user: this.settings.username,
        password: this.settings.password,
        database: this.settings.database,
        connectionTimeoutMillis: 5000
      }
    });
  }

  async enumerateDockets () {
    const dockets = await this.db('search_docket').select();
    return dockets;
  }

  async getCounts () {
    const docketCount = await this.db('search_docket').count();
    const courtCount = await this.db('search_court').count();
    const citationCount = await this.db('search_citation').count();
    const attorneyCount = await this.db('people_db_attorney').count();
    const partyCount = await this.db('people_db_party').count();

    return {
      dockets: docketCount,
      courts: courtCount,
      citations: citationCount,
      attorneys: attorneyCount,
      parties: partyCount
    };
  }

  async sync () {
    console.log('[COURTLISTENER]', 'Syncing...');
    const courts = await this.db('search_court').select();
    console.debug('courts:', courts.slice(0, 10));
  }

  async start () {
    console.log('[COURTLISTENER]', 'Starting...');
    this.getCounts().then((counts) => {
      this.emit('debug', '[COURTLISTENER]', 'Counts:', counts);
    });

    await this.sync();

    return this;
  }
}

module.exports = CourtListener;
