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

  _takeJob () {
    const job = this.jobStack.pop();
  }

  addToCrawlQueue (job) {
    this.jobStack.push(job);
  }

  // TODO: rename to process or work
  async crawl (url) {
    const job = this.jobStack.pop();
    console.debug('beginning crawl job:', job);

    if (job) {
      let initial = null

      try {
        initial = await fetch(job.hyperlink);
      } catch (exception) {
        console.debug('Could not fetch job:', job);
        this.addToCrawlQueue(job);
        return;
      }

      let obj = null;

      try {
        obj = await initial.json();
      } catch (exception) {
        console.debug('Could not convert to JSON:', initial);
        this.addToCrawlQueue(job);
        return;
      }

      if (!obj) {
        console.error('Response was not JSON:', obj);
        return;
      }

      if (!obj.results) {
        console.error('no result in API response:', obj);
        return;
      }

      for (let i = 0; i < obj.results.length; i++) {
        const candidate = obj.results[i];
        const actor = new Actor({ name: `harvard/cases/${candidate.id }` });
        const mine = new Actor({
          fabric_id: actor.id,
          content: candidate
        });

        // this._state.content.objects[object.id] = object;
        // this._state.content.cases[actor.id] = candidate;

        this.emit('case', mine.toJSON());
      }

      // Queue the next page
      if (obj.next) {
        this.addToCrawlQueue({
          hyperlink: obj.next
        });
      }
    }
  }

  async download (url, outputPath) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}. Status: ${response.status}`);
    }

    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(outputPath);

      response.body.pipe(fileStream);
      response.body.on('error', (err) => {
        reject(err);
      });

      fileStream.on('finish', function() {
        resolve();
      });
    });
  }

  async start () {
    this._ticker = setInterval(async () => {
      console.debug(`[${this.settings.frequency}hz]`, 'jobs to process:', this.jobStack);
      const crawl = await this.crawl();
      // console.debug('Total Cases:', Object.keys(this._state.content.cases).length);
    }, this.settings.frequency * 1000);

    this.addToCrawlQueue({
      hyperlink: 'https://api.case.law/v1/cases?full_case=true'
      // hyperlink: 'https://api.case.law/v1/cases?full_case=true&ordering=random'
    });

    this.commit();

    return this;
  }
}

module.exports = Scraper;
