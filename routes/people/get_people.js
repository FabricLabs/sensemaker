'use strict';

const PER_PAGE_LIMIT = require('../../constants');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const page = req.query.page || 1;
      const people = await this.db.select(
        'id as dbid',
        'fabric_id as id',
        'full_name',
        'name_first',
        'name_middle',
        'name_last',
        'name_suffix',
        'date_of_birth',
        'date_of_death',
        'birth_city',
        'birth_state',
        'courtlistener_id'
      ).whereNotNull('fabric_id').from('people').orderBy('full_name', 'asc').paginate({
        perPage: PER_PAGE_LIMIT,
        currentPage: page
      });
    
      res.setHeader('X-Fabric-Type', 'Collection');
      res.setHeader('X-Pagination', true);
      res.setHeader('X-Pagination-Current', `${people.pagination.from}-${people.pagination.to}`);
      res.setHeader('X-Pagination-Per', people.pagination.perPage);
      res.setHeader('X-Pagination-Total', people.pagination.total);
    
      res.format({
        json: () => {
          res.send(people.data);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      })
    }
  })

};
