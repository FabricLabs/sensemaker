'use strict';

// Dependencies
const fetch = require('cross-fetch');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

class Worker extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      authority: 'jeeves.dev',
      frequency: 1,
      state: {
        jobs: [],
        objects: {}
      }
    }, settings);

    this._timer = setInterval(() => {
      // console.debug('...keepalive');
    }, 5000);

    this._state = {
      content: this.settings.state,
      current: null,
      stack: [],
      types: {},
      working: false
    };
  }

  get cases () {
    return this._state.content.cases;
  }

  get jobStack () {
    return this._state.stack;
  }

  addJob (job) {
    this._state.stack.unshift(job);
  }

  register (type, method) {
    this._state.types[type] = method;
  }

  _takeJob () {
    if (this._state.working) return;
    if (!this.jobStack.length) return;

    this._state.working = true;

    const job = this.jobStack.pop();
    const method = this._state.types[job.type];

    if (!method) {
      this.emit('warning', 'Unhandled job type:', job.type);
      return;
    }

    const work = method.apply(this.state, job.params);

    work.then((output) => {
      this._state.working = false;
    });
  }

  async start () {
    this._ticker = setInterval(async () => {
      // console.debug(`[${this.settings.frequency}hz]`, 'jobs to process:', this.jobStack);
      await this._takeJob();
    }, (1 / this.settings.frequency) * 1000);

    this.commit();

    return this;
  }
}

module.exports = Worker;
