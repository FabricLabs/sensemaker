'use strict';

// Dependencies
const fetch = require('cross-fetch');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

// Types
const Queue = require('./queue');

// Environment detection
const isBrowser = typeof window !== 'undefined';
const isNode = !isBrowser && typeof process !== 'undefined';

/**
 * Worker service.
 */
class Worker extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      authority: 'sensemaker.io',
      frequency: 1, // Hz
      state: {
        jobs: [],
        objects: {}
      }
    }, settings);

    // Core Queue
    this.queue = new Queue(this.settings);

    // Heartbeat
    this._timer = setInterval(() => {
      // console.debug('...keepalive');
    }, 5000);

    // Local State
    this._state = {
      content: this.settings.state,
      current: null,
      stack: [],
      types: {},
      working: false
    };

    // Handle cleanup in browser environment
    if (isBrowser) {
      window.addEventListener('beforeunload', () => {
        this.stop();
      });
    }

    return this;
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
      this.emit('work', {
        job,
        output,
        timestamp: Date.now()
      });
      this._state.working = false;
    }).catch((error) => {
      this.emit('error', {
        job,
        error,
        timestamp: Date.now()
      });
      this._state.working = false;
    });
  }

  async start () {
    this._ticker = setInterval(async () => {
      // console.debug(`[${this.settings.frequency}hz]`, 'jobs to process:', this.jobStack);
      await this._takeJob();
    }, (1 / this.settings.frequency) * 1000);

    await this.queue.start();

    this.commit();

    return this;
  }

  async stop () {
    // Clear all intervals
    if (this._heart) clearInterval(this._heart);
    if (this._timer) clearInterval(this._timer);
    if (this._ticker) clearInterval(this._ticker);

    // Stop the queue
    try {
      if (this.queue) {
        await this.queue.stop();
        this.queue = null;
      }
    } catch (error) {
      console.error('[WORKER]', 'Error stopping queue:', error);
    }

    // Clear state
    this._state.working = false;
    this._state.stack = [];
    this._state.current = null;
    this._state.types = {};

    // Emit stopped event
    this.emit('stopped');

    return true;
  }
}

module.exports = Worker;
