'use strict';

const {
  PER_PAGE_LIMIT
} = require('../constants');

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
      },
      pool: {
        min: 0,
        max: 32
      }
    });

    this._state = {
      content: {
        status: 'INITIALIZED',
        collections: {
          documents: {}
        },
        counts: {
          cases: 0,
          citations: 0,
          opinions: 0
        }
      }
    };

    return this;
  }

  async enumerateCourts () {
    this.emit('debug', 'Enumerating courts...');
    const courts = await this.db('search_court').select();
    return courts;
  }

  async enumerateDockets () {
    this.emit('debug', 'Enumerating dockets...');
    const dockets = await this.db('search_docket').select();
    return dockets;
  }

  async enumerateRecapDocuments () {
    this.emit('debug', 'Enumerating RECAP documents...');
    const documents = await this.db('search_recapdocument').select();
    return documents;
  }

  async enumeratePeople () {
    this.emit('debug', 'Enumerating people...');
    const people = await this.db('people_db_person').select();
    return people;
  }

  async sampleOpinionClusters () {
    this.emit('debug', 'Sampling opinion clusters...');
    const opinions = await this.db('search_opinioncluster').select().orderByRaw('RANDOM()').limit(PER_PAGE_LIMIT);
    return opinions;
  }

  async sampleOpinions () {
    this.emit('debug', 'Sampling opinions...');
    const opinions = await this.db('search_opinion').select().orderByRaw('RANDOM()').limit(PER_PAGE_LIMIT);
    return opinions;
  }

  async sampleRecapDocuments (limit = PER_PAGE_LIMIT) {
    this.emit('debug', 'Sampling RECAP documents...');
    const now = Date.now();
    const documents = await this.db('search_recapdocument').select().orderByRaw('RANDOM()').limit(limit);
    const end = Date.now();
    this.emit('debug', 'Sampled', documents.length, 'documents in', end - now, 'ms.');
    return documents;
  }

  async paginateDockets (page = 0, limit = PER_PAGE_LIMIT) {
    const dockets = await this.db('search_docket').select().limit(limit).offset(page * limit);
    const count = await this.db('search_docket').count();

    return {
      page: page,
      limit: limit,
      total: count[0].count,
      dockets: dockets
    };
  }

  async paginateRecapDocuments (page = 0, limit = PER_PAGE_LIMIT) {
    const documents = await this.db('search_recapdocument').select().limit(limit).offset(page * limit);
    const count = await this.db('search_recapdocument').count();

    return {
      page: page,
      limit: limit,
      total: count[0].count,
      documents: documents
    };
  }

  async streamRecapDocuments (handler) {
    const stream = this.db('search_recapdocument').stream((stream) => {
      stream.on('data', handler);
      stream.on('end', () => {
        this.emit('debug', 'Stream ended.');
      });
    });

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
      const docketCount = await this.db('search_docket').count();
      const courtCount = await this.db('search_court').count();
      const citationCount = await this.db('search_citation').count();
      const personCount = await this.db('people_db_person').count();
      const attorneyCount = await this.db('people_db_attorney').count();
      const opinionClusterCount = await this.db('search_opinioncluster').count();
      const opinionCount = await this.db('search_opinion').count();
      const partyCount = await this.db('people_db_party').count();

      // Tracking
      const end = Date.now();
      this.emit('debug', 'Counted in', end - now, 'ms.');

      // Return counts
      return {
        dockets: docketCount[0].count,
        courts: courtCount[0].count,
        citations: citationCount[0].count,
        persons: personCount[0].count,
        attorneys: attorneyCount[0].count,
        opinionClusters: opinionClusterCount[0].count,
        opinions: opinionCount[0].count,
        parties: partyCount[0].count
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

  async syncPeople () {
    // TODO: this should be a stream
    const people = await this.enumeratePeople();

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      this.emit('person', person);
    }

    return people;
  }

  async syncOpinions () {
    // TODO: this should be a stream
    const opinions = await this.sampleOpinions();

    for (let i = 0; i < opinions.length; i++) {
      const opinion = opinions[i];
      this.emit('opinion', opinion);
    }

    return opinions;
  }

  async syncOpinionClusters () {
    // TODO: this should be a stream
    const clusters = await this.sampleOpinionClusters();

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      this.emit('opinioncluster', cluster);
    }

    return clusters;
  }

  async syncRecapDocuments () {
    // TODO: this should be a stream
    const documents = await this.sampleRecapDocuments();

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      this.emit('document', {
        type: 'Document',
        content: document
      });
    }

    return documents;
  }

  async syncSamples () {
    return Promise.all([
      this.syncRecapDocuments()
    ]);
  }

  async sync () {
    console.debug('[COURTLISTENER]', 'Syncing...');
    this._state.content.status = 'SYNCING';

    // Estimate Work
    const counts = await this.getCounts();
    this.emit('debug', '[COURTLISTENER]', 'Counts:', counts);
    this._state.content.counts = Object.assign(this._state.content.counts, counts);

    // Sync Data Sources
    // TODO: Dockets
    // Courts
    await this.syncCourts();

    // People
    // await this.syncPeople();

    // Opinions
    // await this.syncOpinions();

    // Opinion Clusters
    // await this.syncOpinionClusters();

    // PACER / RECAP Documents
    // await this.syncRecapDocuments();

    this._state.content.status = 'SYNCED';
    this.commit();

    // EMIT SYNC EVENT
    this.emit('sync', {
      type: 'Sync',
      state: this.state
    });

    console.debug('[COURTLISTENER]', 'Sync complete!');
  }

  async start () {
    console.log('[COURTLISTENER]', 'Starting...');

    this.db.on('error', (error) => {
      this.emit('debug', '[COURTLISTENER]', 'Error:', error);
    });

    // Begin syncing
    this.sync().then(() => {
      this._state.content.status = 'SYNCED';
      this.emit('ready');
    }).catch((exception) => {
      this.emit('debug', '[COURTLISTENER]', 'Exception:', exception);
    });

    return this;
  }
}

module.exports = CourtListener;
