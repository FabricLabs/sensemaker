'use strict';

const { createClient } = require('redis');
const merge = require('lodash.merge');
const Service = require('@fabric/core/types/service');

class Redis extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      redis: {
        username: 'default',
        password: 'default',
        socket: 'default'
      },
      state: {}
    }, settings);

    this._state = {
      client: null,
      connected: false,
      status: 'disconnected'
    };
  }

  async start () {
    try {
      await this.connect();
    } catch (error) {
      console.error('[SENSEMAKER:CORE]', '[REDIS]', 'Error starting Redis:', error);
    }
  }

  async connect () {
    this.client = createClient({
      username: this.settings.redis.username,
      password: this.settings.redis.password,
      socket: this.settings.redis
    });

    await this.client.connect();
    this._state.connected = true;
  }

  async disconnect () {
    await this.client.quit();
  }

  async get (key) {
    return await this.client.get(key);
  }

  async set (key, value) {
    return await this.client.set(key, value);
  }

  async del (key) {
    return await this.client.del(key);
  }

  async exists (key) {
    return await this.client.exists(key);
  }

  async keys (pattern) {
    return await this.client.keys(pattern);
  }

  async subscribe (channel, callback) {
    return await this.client.subscribe(channel, callback);
  }

  async unsubscribe (channel) {
    return await this.client.unsubscribe(channel);
  }

  async publish (channel, message) {
    return await this.client.publish(channel, message);
  }
}

module.exports = Redis;