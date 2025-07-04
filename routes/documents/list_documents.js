'use strict';

const { PER_PAGE_LIMIT } = require('../../constants')

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const currentPage = req.query.page || 1;
      let query = this.db('documents').select([
        'id',
        'title',
        'description',
        'summary',
        'fabric_type',
        'mime_type',
        'fabric_id',
        'created_at',
        'updated_at',
        'latest_blob_id',
        'pinned',
        'folders'
      ]).whereNotNull('fabric_id').andWhere('status', '!=', 'deleted').andWhere(function () {
        return this.where('creator', '=', req.user.id).orWhere('owner', '=', req.user.id);
      });

      // Apply filter if provided
      if (req.query.filter) {
        try {
          const filter = JSON.parse(req.query.filter);

          if (filter.type) {
            query = query.andWhere('fabric_type', filter.type);
          }

          // Handle status filter
          if (filter.status) {
            query = query.andWhere('status', filter.status);
          }
        } catch (error) {
          console.error('[DOCUMENTS:LIST] Invalid filter JSON:', req.query.filter, error);
          return res.status(400).json({
            status: 'error',
            message: 'Invalid filter format. Must be valid JSON.'
          });
        }
      }

      const documents = await query.orderBy('pinned', 'desc').orderBy('created_at', 'desc').paginate({
        perPage: 24,
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
  });
};

