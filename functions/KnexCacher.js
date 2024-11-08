'use strict';

const crypto = require('crypto');

module.exports = async function (qry) {
  try {
    let getHashKey = (query) => {
      let retKey = '';
      retKey = crypto.createHash('sha256').update(query).digest('hex');
      return 'CACHE_ASIDE_' + retKey;
    }

    const fingerprint = getHashKey(qry);

    let cachedData = await this.redis.get(fingerprint);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    else {
      let data = await this;
      this.redis.set(fingerprint, JSON.stringify(data), {NX: true});
      return data;
    }
  } catch (e) {
    throw new Error(e);
  }
};
