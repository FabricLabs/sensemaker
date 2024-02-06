'use strict';

// Constants
const {
  JURISDICTION_DOMAIN
} = require('../constants');

// Dependencies
const fetch = require('cross-fetch');
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

// States
// TODO: request index export
const { Texas } = require('../scrapper/js-code/scrappers/Texas');

/**
 * Statute Provider
 */
class StatuteProvider extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'StatuteProvider',
      jurisdictions: JURISDICTION_DOMAIN,
      state: {
        status: 'INITIALIZED',
        collections: {
          documents: {},
          jurisdictions: {},
          statutes: {}
        },
        counts: {
          documents: 0,
          jurisdictions: 0,
          statutes: 0
        }
      }
    }, settings);

    this.scrappers = {
      'Texas': new Texas()
    };

    this._state = {
      content: this.settings.state,
      // TODO: discuss history storage
      history: []
    };

    return this;
  }

  createJurisdiction (jurisdiction) {
    if (!jurisdiction.name) throw new Error('Jurisdiction must have a name.');
    const actor = new Actor({ name: jurisdiction.name }); // creates unique ID
    this._state.content.collections.jurisdictions[actor.id] = jurisdiction;
    this.commit();
    this.emit('jurisdiction', jurisdiction);
    return { ...jurisdiction, id: actor.id };
  }

  enumerateDocuments () {
    return Object.values(this._state.content.collections.documents);
  }

  enumerateJurisdictions () {
    return Object.values(this._state.content.collections.jurisdictions);
  }

  enumerateStatutes () {
    return Object.values(this._state.content.collections.statutes);
  }

  enumerateStatuteEvents () {
    this.emit('debug', 'Enumerating statute events...');
    return Object.values(this._state.history);
  }

  registerStatuteEvent (event) {
    this.emit('debug', 'Registering statute event...');
    this._state.history.push(event);
    this._state.history.sort((a, b) => a.timestamp - b.timestamp);
    switch (event.type) {
      default:
        console.error('[STATUTE]', 'Unknown event type:', event.type);
        break;
      case 'enactment':
        this._state.content.collections.statutes[event.statute.id] = event.statute;
        break;
      case 'amendment':
        break;
      case 'repeal':
        break;
    }

    this.commit();
  }

  listCurrentStatutes () {
    return Object.values(this.state.collections.statutes);
  }

  statutesByJurisdictionName (name) {
    return this.listCurrentStatutes().filter(statute => statute.jurisdiction.name === name);
  }

  async search (request) {
    const results = [];

    // TODO: filter by jurisdiction
    // TODO iterate and search each jurisdiction

    const result = {
      type: 'StatuteSearchResult',
      query: request,
      results: results
    };

    return result;
  }

  async start () {
    // Create Jurisdictions from constants
    // TODO: add completed states to constants
    for (let i = 0; i < this.settings.jurisdictions.length; i++) {
      this.createJurisdiction({ name: this.settings.jurisdictions[i] });
    }

    await this.sync();

    this.emit('debug', 'Sync complete!');
    this.commit();

    return this;
  }

  async sync () {
    // Core Sync
    await this.syncJurisdictions();
    await this.syncConstitutions();
    // await this.syncStatutes();
    // await this.syncAdminCode();
    // await this.syncCourtRules();

    this.commit();
    this.emit('sync', this.state);

    return this;
  }

  async syncConstitutions () {
    console.debug('[STATUTE] Syncing Constitutions...');
    for (let jurisdiction of this.settings.jurisdictions) {
      const scrapper = this.scrappers[jurisdiction];
      const constitution = await scrapper.constitution();
      console.debug('[STATUTE] Got constitution:', constitution);
      // this._state.content.collections.documents[constitution.id] = constitution;
      this.commit();
      // this.emit('document', constitution);
    }
  }

  async syncStateByName (name) {
    const jurisdiction = await this.syncJurisdictionByName(name);
    const statutes = await this.syncStatutesByJurisdiction(jurisdiction);
    return statutes;
  }

  async syncJurisdictionByName (name) {
    // TODO: lookup jurisdiction by name on beta.jeeves.dev
    const jurisdictions = await this.syncJurisdictions();
    const jurisdiction = jurisdictions.find(jurisdiction => jurisdiction.name === name);
    return jurisdiction;
  }

  async syncJurisdictions () {
    const result = await fetch('https://beta.jeeves.dev/jurisdictions');

    try {
      const jurisdictions = await result.json();
      console.debug('[STATUTE] Got remote jurisdictions:', jurisdictions);
      for (let i = 0; i < jurisdictions.length; i++) {
        const candidate = jurisdictions[i];
        console.debug('[STATUTE] Got remote jurisdiction:', candidate.name);
        const jurisdiction = this.createJurisdiction(candidate);
        this._state.content.collections.jurisdictions[candidate.id] = jurisdiction;
        this.commit();
        this.emit('jurisdiction', jurisdiction);
      }

      return jurisdictions;
    } catch (exception) {
      console.error('[STATUTE] Could not fetch jurisdictions:', exception);
      return null;
    }
  }

  async syncStatutesByJurisdiction (jurisdiction) {
    const statutes = await this.allStatutesByJurisdiction(jurisdiction);

    for (let statute of statutes) {
      this._state.content.collections.statutes[statute.id] = statute;
      this.emit('statute', statute);
    }

    this.commit();
    return statutes;
  }
}

module.exports = StatuteProvider;
