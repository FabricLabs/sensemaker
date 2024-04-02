'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

const { createClient } = require('redis');

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
    return 1000 / this.settings.frequency; // ms
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
      if (!this._state.current) this._state.current = await this._takeJob();
      console.debug('[QUEUE]', 'Current job:', this._state.current);
      if (this._state.current && !this._state.current.status) {
        this._state.current.status = 'COMPUTING';
        Promise.race([
          this._completeJob(this._state.current),
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error('Job timed out.'));
            }, this.interval);
          })
        ]).catch((exception) => {
          console.error('[QUEUE]', 'Job failed:', exception);
          this._state.current = null;
        }).then((result) => {
          console.debug('[QUEUE]', 'Finished work:', result);
          this._state.current = null;
        });
      }
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

  async _registerMethod (name, contract) {
    if (this._methods[name]) return this._methods[name];
    // TODO: bind state?
    this._methods[name] = contract.bind({});
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
    return job;
  }

  async _completeJob (job) {
    if (this._methods[job.method]) {
      const result = await this._methods[job.method](...job.params);
      console.debug('[QUEUE]', 'Completed job:', job);
      return result;
    }

    switch (job.method) {
      default:
        console.warn('[QUEUE]', 'Unhandled job type:', job.method);
        return { status: 'FAILED', message: 'Unhandled job type.' };
    }
  }

  async _failJob (job) {

  }
}

module.exports = Queue;
