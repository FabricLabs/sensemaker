'use strict';

// Dependencies
const fetch = require('cross-fetch');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

// Fabric HTTP Types
const Remote = require('@fabric/http/types/remote');

class Scraper extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      authority: 'jeeves.dev',
      frequency: 1,
      state: {
        cases: {},
        objects: {}
      }
    }, settings);

    this.remote = new Remote({
      authority: 'api.case.law',
      hostname: 'api.case.law'
    });

    this._timer = setInterval(() => {
      console.debug('...keepalive');
    }, 5000);

    this._state = {
      content: this.settings.state,
      stack: []
    };
  }

  get cases () {
    return this._state.content.cases;
  }

  get jobStack () {
    return this._state.stack;
  }

  addToCrawlQueue (job) {
    this._state.stack.unshift(job);
  }

  async crawl (url) {
    const job = this.jobStack.pop();
    console.debug('beginning crawl job:', job);

    if (job) {
      const initial = await fetch(job.hyperlink);
      const obj = await initial.json();

      for (let i = 0; i < obj.results.length; i++) {
        const candidate = obj.results[i];
        const object = new Actor(candidate);
        const actor = new Actor({ harvard_case_law_id: candidate.id });
        const mine = new Actor({
          fabric_id: actor.id,
          content: candidate
        });

        this._state.content.objects[object.id] = object;
        this._state.content.cases[actor.id] = candidate;

        console.log('found case:', mine.toJSON());

        this.emit('case', mine.toJSON());
      }

      // Queue the next page
      if (obj.next) {
        this.jobStack.push({
          hyperlink: obj.next
        });
      }
    }
  }

  async start () {
    this._ticker = setInterval(async () => {
      console.debug(`[${this.settings.frequency}hz]`, 'jobs to process:', this.jobStack);
      const crawl = await this.crawl();
      console.debug('Total Cases:', Object.keys(this._state.content.cases).length);
    }, this.settings.frequency * 1000);

    this.addToCrawlQueue({
      hyperlink: 'https://api.case.law/v1/cases'
    });

    this.commit();

    return this;
  }
}

module.exports = Scraper;
