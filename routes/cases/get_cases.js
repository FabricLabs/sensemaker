'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

// Components
const CaseHome = require('../../components/CaseHome');

// Exports
module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const cases = await this.db.select(
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
