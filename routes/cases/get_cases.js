'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

// Components
const CaseHome = require('../../components/CaseHome');
const Cache = require('../../types/cache');

// Exports
module.exports = function (req, res, next) {
  res.format({
    json: async () => {

      this.cache = new Cache(this.redis, "GET /cases HTTP/1.1");

      // If cached data exists, assign it to cases. Otherwise, assign the db call to cases.
      let cases = await this.cache.try();
      if (!cases) cases = await this.db.select(
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

      // Store fingerprint cases pair
      this.redis.set(this.cache.fingerprint, JSON.stringify(cases), {NX: true});

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
