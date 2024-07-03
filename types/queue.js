'use strict';

// Dependencies
const merge = require('lodash.merge');
const { createClient } = require('redis');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

/**
 * A `Queue` is a simple job queue for managing asynchronous tasks.
 */
class Queue extends Actor {
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      clock: 0,
      collection: 'queue:jobs',
      frequency: 1, // hz
      redis: null,
      state: {
        status: 'STOPPED',
        jobs: {}
      },
      worker: false,
      workers: 0
    }, settings);

    this._state = {
      clock: this.settings.clock,
      content: this.settings.state,
      current: null,
      output: [],
      status: 'STOPPED'
    };

    this._methods = {};
    this._workers = [];
    this.redis = null;

    return this;
  }

  set clock (value) {
    this._state.clock = value;
  }

  get clock () {
    return this._state.clock;
  }

  get addJob () {
    return this._addJob.bind(this);
  }

  get interval () {
    return 100 / this.settings.frequency; // ms
  }

  get jobs () {
    return new Promise(async (resolve, reject) => {
      if (this.redis) {
        this.redis.lRange(this.settings.collection, 0, -1).catch(reject).then(resolve);
      } else {
        resolve(Object.values(this.state.jobs));
      }
    });
  }

  async _tick () {
    ++this.clock;

    if (this.settings.worker) {
      console.debug('[QUEUE]', 'Jobs in queue:', await this.jobs);
      this._state.current = await this._takeJob();
      console.debug('[QUEUE]', 'Current job:', this._state.current);

      // If there's work to do, do it
      if (this._state.current && !this._state.current.status) {
        console.log('actual current queue: ', this._state.current)
        this._state.current.status = 'COMPUTING';

        // TODO: copy this to a "doWork" method, take new job immediately (or sleep if none available)
        // Race to Complete or Timeout
        Promise.race([
          this._completeJob(this._state.current),
          new Promise((resolve, reject) => {
            setTimeout(() => {
              console.error('[QUEUE]', 'Job timed out:', this._state.current);
              reject(new Error('Job timed out.'));
            }, this.interval);
          })
        ]).catch((exception) => {
          console.error('[QUEUE]', 'Job failed:', exception);
          this._state.current = null;
          // TODO: implement retries here (decrement counter, reinsert job into queue)
        }).then((result) => {
          console.debug('[QUEUE]', 'Finished work:', result);
          this._state.current = null;
          this._state.output.push(result);
        });
      }

      console.debug('[QUEUE]', 'Jobs completed this epoch:', this._state.output.length);
      this._state.output = [];
    }

    console.debug('[QUEUE]', 'TICK', this.clock);
  }

  async start () {
    await this._registerMethod('verify', async function (...params) {
      return true;
    });

    if (this.settings.redis) {
      // Primary Redis client
      this.redis = createClient({
        username: this.settings.redis.username,
        password: this.settings.redis.password,
        socket: this.settings.redis
      });

      // For subscriptions (blocking, requires its own connection)
      this.subscriber = this.redis.duplicate();

      // Event Listeners
      this.redis.on('ready', (err) => {
        console.debug('[QUEUE]', 'Redis ready:', err);
      });

      await this.redis.connect();
      await this.subscriber.connect();

      // TODO: enable `notify-keyspace-events` on Redis server
      await this.subscriber.pSubscribe(`__keyspace@0__:queue:*`, async (message, channel) =>{
        console.debug('[QUEUE]', 'Received message:', channel, message);
        const affectedKey = channel.substring('__keyspace@0__:'.length);
        if (affectedKey === this.settings.collection) {
          console.debug('[QUEUE]', 'Affected key:', affectedKey);
        }
      });
    }

    for (let i = 0; i < this.settings.workers; i++) {
      const worker = (async () => {}).bind(this);
      this._workers.push(worker);
    }

    this.ticker = setInterval(this._tick.bind(this), this.interval);
  }

  async _registerMethod (name, contract, context = {}) {
    if (this._methods[name]) return this._methods[name];
    this._methods[name] = contract.bind(context);
    return this._methods[name];
  }

  async _addJob (job) {
    if (!job.id) job = new Actor(job);
    if (this.state.jobs[job.id]) return this.state.jobs[job.id];

    // Add job to state
    this._state.content.jobs[job.id] = job;

    if (this.redis) {
      const result = await this.redis.rPush(this.settings.collection, JSON.stringify(job.toGenericMessage().object));
      console.debug('[QUEUE]', 'Added job to queue:', result);
    }

    this.emit('job', this.state.jobs[job.id]);
    return this._state.content.jobs[job.id];
  }

  async _takeJob () {
    const json = await this.redis.lPop(this.settings.collection);
    const job = JSON.parse(json);
    console.debug('[QUEUE]', 'Took job:', job);

    // TODO: canonize this API
    this.emit('QueueJob', {
      type: 'QueueJob',
      content: job
    });

    if (this.redis) {
      await this.redis.publish('job:taken', JSON.stringify({ job }));
    }
    return job;
  }

  async _completeJob (job) {
    if (this._methods[job.method]) {
      const result = await this._methods[job.method](...job.params);
      console.debug('[QUEUE]', 'Completed job:', job);

      // TODO: reverse this logic to reject if !this.redis
      if (this.redis) {
        await this.redis.publish('job:completed', JSON.stringify({ job, result }));
      }

      return result;
    }

    switch (job.method) {
      default:
        console.warn('[QUEUE]', 'Unhandled job type:', job.method);
        const failureResult = { status: 'FAILED', message: 'Unhandled job type.' };
        if (this.redis) {
          await this.redis.publish('job:completed', JSON.stringify({ job, result: failureResult }));
        }
        return failureResult;
    }
  }


  async _failJob (job) {

  }
}

module.exports = Queue;
