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

  async enumerateCourts () {
    const courts = await this.db('search_court').select();
    return courts;
  }

  async enumerateDockets () {
    const dockets = await this.db('search_docket').select();
    return dockets;
  }

  async enumerateRecapDocuments () {
    const documents = await this.paginateRecapDocuments();
    return documents;
  }

  async enumeratePeople () {
    const people = await this.db('people_db_person').select();
    return people;
  }

  async enumerateOpinions () {
    const opinions = await this.db('search_opinioncluster').select();
    return opinions;
  }

  async paginateDockets (page = 0, limit = 100) {
    const dockets = await this.db('search_docket').select().limit(limit).offset(page * limit);
    const count = await this.db('search_docket').count();

    return {
      page: page,
      limit: limit,
      total: count[0].count,
      dockets: dockets
    };
  }

  async paginateRecapDocuments (page = 0, limit = 100) {
    const documents = await this.db('search_recapdocument').select().limit(limit).offset(page * limit);
    const count = await this.db('search_recapdocument').count();

    return {
      page: page,
      limit: limit,
      total: count[0].count,
      documents: documents
    };
  }

  async query (table) {
    return this.db(table);
  }

  async getCounts () {
    const docketCount = await this.db('search_docket').count();
    const courtCount = await this.db('search_court').count();
    const citationCount = await this.db('search_citation').count();
    const personCount = await this.db('people_db_person').count();
    const attorneyCount = await this.db('people_db_attorney').count();
    const partyCount = await this.db('people_db_party').count();

    return {
      dockets: docketCount,
      courts: courtCount,
      citations: citationCount,
      persons: personCount,
      attorneys: attorneyCount,
      parties: partyCount
    };
  }

  async sync () {
    console.log('[COURTLISTENER]', 'Syncing...');

    // Courts
    // TODO: this should be a stream
    const courts = await this.enumerateCourts();

    for (let i = 0; i < courts.length; i++) {
      const court = courts[i];
      this.emit('court', court);
    }

    // People
    // TODO: this should be a stream
    const people = await this.enumeratePeople();

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      this.emit('person', person);
    }

    // Opinions
    // TODO: this should be a stream
    const opinions = await this.enumerateOpinions();

    for (let i = 0; i < opinions.length; i++) {
      const opinion = opinions[i];
      this.emit('opinion', opinion);
    }

    // PACER / RECAP Documents
    // TODO: this should be a stream
    const documents = await this.enumerateRecapDocuments();

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      this.emit('document', {
        type: 'RECAP_DOCUMENT',
        content: document
      });
    }

    // EMIT SYNC EVENT
    this.emit('sync', {
      type: 'Sync',
      state: {
        content: {
          courts: courts,
          // people: people,
          // opinions: opinions,
          // documents: documents
        }
      }
    });
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
