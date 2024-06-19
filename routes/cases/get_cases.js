'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

// Components
const CaseHome = require('../../components/CaseHome');
const { createClient } = require('redis');
const crypto = require('crypto');

const getHashKey = (text) => {
  let retKey = '';
  retKey = crypto.createHash('sha256').update(text).digest('hex');
  return 'CACHE_ASIDE_' + retKey;
};

/*
class Cache {
  constructor(type) {
    this.type = type;
  }
  async try(text) {
    const hashKey = this.getHashKey(text);
    const cachedData = await this.redis.get(hashKey);
    const docArr = cachedData ? JSON.parse(cachedData) : [];
  }
  getHashKey = (text) => {
    let retKey = '';
    retKey = crypto.createHash('sha256').update(text).digest('hex');
    return 'CACHE_ASIDE_' + retKey;
  }
}
*/

// Exports
module.exports = function (req, res, next) {
  res.format({
    json: async () => {

      // Primary Redis client
      this.redis = createClient({
        username: this.settings.redis.username,
        password: this.settings.redis.password,
        socket: this.settings.redis
      });

      await this.redis.connect();

      // "GET /cases HTTP/1.1"
      // var request_line = req.method + " " + req.originalUrl + " HTTP/" + req.httpVersion;
      const hashKey = getHashKey("GET /cases HTTP/1.1");
      const cachedData = await this.redis.get(hashKey);
      const docArr = cachedData ? JSON.parse(cachedData) : false;
      
      if (docArr) {
        var cases = docArr;
      }
      else {
        var cases = await this.db.select(
          'id',
          'title',
          'short_name',
          'created_at',
          'decision_date',
          'harvard_case_law_court_name as court_name',
          'harvard_case_law_id'
        ).from('cases').whereNotNull('harvard_case_law_id').whereNotNull('harvard_case_law_pdf').orderBy('decision_date', 'desc').paginate({
          perPage: PER_PAGE_LIMIT,
          currentPage: 1
        });

        this.redis.set(hashKey, JSON.stringify(cases));

      }

      res.setHeader('X-Pagination', true);
      res.setHeader('X-Pagination-Current', `${cases.pagination.from}-${cases.pagination.to}`);
      res.setHeader('X-Pagination-Per', cases.pagination.perPage);
      res.setHeader('X-Pagination-Total', cases.pagination.total);

      res.send(cases.data);
    },
    html: () => {
      // TODO: import auth token, load data
      const page = new CaseHome({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
