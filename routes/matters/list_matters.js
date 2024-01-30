'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

// Components
const MattersHome = require('../../components/MattersHome');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      const matters = await this.db('matters').where('creator', req.user.id).paginate({
        perPage: PER_PAGE_LIMIT,
        currentPage: 1
      });

      res.send(matters.data);
    },
    html: () => {
      // TODO: import auth token, load data
      const page = new MattersHome({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
