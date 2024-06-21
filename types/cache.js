'use strict';

const crypto = require('crypto');

class Cache {
  constructor(redis, query) {
    this.redis = redis;
    this.fingerprint = this.getHashKey(query);

    return this;
  }
  // Search database for SHA256 fingerprint and return JSON parsed cached data if the key value pair exists. Otherwise, return false.
  async try() {
    const cachedData = await this.redis.get(this.fingerprint);
    return cachedData ? JSON.parse(cachedData) : false;
  }
  // Get a SHA256 fingerprint from query string.
  getHashKey = (query) => {
    let retKey = '';
    retKey = crypto.createHash('sha256').update(query).digest('hex');
    return 'CACHE_ASIDE_' + retKey;
  }
  async select(...args)  {
    let data = await this.try();
    if (!data) data = await this.db.select(...args);
    return data;
  }
  async from(...args)  {
    let data = await this.try();
    if (!data) data = await this.db.from(...args);
    return data;
  }
}

module.exports = Cache;