'use strict';

const input = {
  authority: 'jeeves.dev'
};

// Dependencies
const fetch = require('cross-fetch');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Fabric HTTP Types
const Remote = require('@fabric/http/types/remote');

class Scraper {
  constructor (settings = {}) {
    this.settings = Object.assign({
      authority: 'jeeves.dev',
      state: {
        cases: {}
      }
    }, settings);

    this.remote = new Remote({
      authority: 'api.case.law',
      hostname: 'api.case.law'
    });

    this._state = {
      content: this.settings.state
    };
  }

  async crawl (url) {
    const initial = await fetch(url);
    const obj = initial.json();
    console.log('obj:', obj);
  }

  async start () {
    const index = await this.remote._GET('/v1/cases');
    console.log('got index:', index);
    for (let i = 0; i < index.results.length; i++) {
      const candidate = index.results[i];
      const actor = new Actor(candidate);
      this._state.content.cases[actor.id] = candidate;
    }

    this.commit();
  }
}

async function main (settings = {}) {
  const scraper = new Scraper(settings);
  await scraper.start();
  return {
    // id: this.id,
    scraper: scraper
  };
}

main(input).then((output) => {
  console.log('[JEEVES:SCRAPER]', output);
});
