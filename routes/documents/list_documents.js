'use strict';

const {PER_PAGE_LIMIT} = require('../../constants')

module.exports = function (req, res, next) {
  res.format({
        json: async () => {
          const currentPage = req.query.page || 1;
          const documents = await this.db('documents').select('*').whereNotNull('fabric_id').andWhere('deleted', '=', 0).orderBy('created_at', 'desc').paginate({
            perPage: PER_PAGE_LIMIT,
            currentPage: currentPage
          });
    
          res.setHeader('X-Pagination', true);
          res.setHeader('X-Pagination-Current', `${documents.pagination.from}-${documents.pagination.to}`);
          res.setHeader('X-Pagination-Per', documents.pagination.perPage);
          res.setHeader('X-Pagination-Total', documents.pagination.total);
    
          res.send(documents.data);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }      
  })
  };

