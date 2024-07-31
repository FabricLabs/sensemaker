'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const files = await this.db('matters_files')
        .where('matters_files.matter_id', req.params.id)
        .where('matters_files.deleted', 0)
        .join('files', 'matters_files.file_id', 'files.id')
        .select('matters_files.*', 'files.status')
        .orderBy('matters_files.created_at', 'desc')
        .paginate({
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
