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
const { Arkansas } = require('../scrapper/js-code/scrappers/Arkansas');
const { California } = require('../scrapper/js-code/scrappers/California');
const { Colorado } = require('../scrapper/js-code/scrappers/Colorado');
const { Florida } = require('../scrapper/js-code/scrappers/Florida');
const { NewJersey } = require('../scrapper/js-code/scrappers/NewJersey');
const { NewYork } = require('../scrapper/js-code/scrappers/NewYork');
const { Ohio } = require('../scrapper/js-code/scrappers/Ohio');
const { Pennsylvania } = require('../scrapper/js-code/scrappers/Pennsylvania');
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
      'Arkansas': new Arkansas(),
      'California': new California(),
      'Colorado': new Colorado(),
      'Florida': new Florida(),
      'NewJersey': new NewJersey(),
      'NewYork': new NewYork(),
      'Ohio': new Ohio(),
      'Pennsylvania': new Pennsylvania(),
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
        console.error('[STATUTES]', 'Unknown event type:', event.type);
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
    await this.syncStatutes();
    await this.syncAdminCode();
    await this.syncCourtRules();

    this.commit();
    this.emit('sync', this.state);

    return this;
  }

  async syncAdminCode () {
    console.debug('[STATUTES] Syncing Administrative Code...');
    for (let jurisdiction of this.settings.jurisdictions) {
      const scrapper = this.scrappers[jurisdiction];
      await scrapper.administrativeCodes();
      // this._state.content.collections.documents[statutes.id] = statutes;
      this.commit();
      // this.emit('document', statutes);
    }
  }

  async syncConstitutions () {
    console.debug('[STATUTES] Syncing Constitutions...');
    for (let jurisdiction of this.settings.jurisdictions) {
      const scrapper = this.scrappers[jurisdiction];
      await scrapper.constitution();
      // this._state.content.collections.documents[constitution.id] = constitution;
      this.commit();
      // this.emit('document', constitution);
    }
  }

  async syncCourtRules () {
    console.debug('[STATUTES] Syncing Court Rules...');
    for (let jurisdiction of this.settings.jurisdictions) {
      const scrapper = this.scrappers[jurisdiction];
      await scrapper.rulesOfCourt();
      // this._state.content.collections.documents[statutes.id] = statutes;
      this.commit();
      // this.emit('document', statutes);
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
      console.debug('[STATUTES] Got remote jurisdictions:', jurisdictions);
      for (let i = 0; i < jurisdictions.length; i++) {
        const candidate = jurisdictions[i];
        console.debug('[STATUTES] Got remote jurisdiction:', candidate.name);
        const jurisdiction = this.createJurisdiction(candidate);
        this._state.content.collections.jurisdictions[candidate.id] = jurisdiction;
        this.commit();
        this.emit('jurisdiction', jurisdiction);
      }

      return jurisdictions;
    } catch (exception) {
      console.error('[STATUTES] Could not fetch jurisdictions:', exception);
      return null;
    }
  }

  async syncStatutes () {
    console.debug('[STATUTES] Syncing Statutes...');
    console.debug('[STATUTES] Scrappers:', this.scrappers)
    for (let jurisdiction of this.settings.jurisdictions) {
      const scrapper = this.scrappers[jurisdiction];
      const statutes = await scrapper.statutes();
      console.debug('[STATUTES] Got statutes:', statutes);
      // this._state.content.collections.documents[statutes.id] = statutes;
      this.commit();
      // this.emit('document', statutes);
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
