'use strict';

module.exports = function (req, res, next) {
  res.format({
    json:async () => {
      const currentPage = req.query.page || 1;
      const documents = await this.db('documents').select('id', 'sha1', 'sha256', 'description', 'created_at', 'fabric_id', 'html', 'content', 'title', 'file_id', 'file_size').whereNotNull('fabric_id').andWhere('deleted', '=', 0).orderBy('created_at', 'desc').paginate({
        perPage: PER_PAGE_LIMIT,
        currentPage: currentPage
      });
    
      res.format({
        json: () => {
          // Create response
          const response = (documents && documents.data && documents.data.length) ? documents.data.map((doc) => {
            return {
              id: doc.fabric_id,
              created_at: doc.created_at,
              description: doc.description,
              sha1: doc.sha1,
              sha256: doc.sha256,
              size: doc.file_size,
              title: doc.title,
              file_id: doc.file_id,
            };
          }) : [];
    
          // Set Pagination Headers
          res.setHeader('X-Pagination', true);
          res.setHeader('X-Pagination-Current', `${documents.pagination.from}-${documents.pagination.to}`);
          res.setHeader('X-Pagination-Per', documents.pagination.perPage);
          res.setHeader('X-Pagination-Total', documents.pagination.total);
    
          return res.send(response);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    }
  })

};