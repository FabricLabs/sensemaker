'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

// Components

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const matters = await this.db('matters').where('creator', req.user.id).orderBy('updated_at', 'desc').paginate({
        perPage: PER_PAGE_LIMIT,
        currentPage: 1
      });

      res.send(matters.data);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
