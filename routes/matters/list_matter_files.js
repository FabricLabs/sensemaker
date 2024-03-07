'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const files = await this.db('matters_files')
        .where('matter_id', req.params.id)
        .where('deleted', 0)
        .orderBy('created_at', 'desc').paginate({
          perPage: PER_PAGE_LIMIT,
          currentPage: 1
        });
      res.send(files.data);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
