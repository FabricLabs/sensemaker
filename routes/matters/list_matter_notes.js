'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const notes = await this.db('matters_notes')
        .where('matter_id', req.params.id)
        .where('deleted', 0)
        .orderBy('created_at', 'desc')
        .paginate({
          perPage: PER_PAGE_LIMIT,
          currentPage: 1
        });
      res.send(notes.data);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
