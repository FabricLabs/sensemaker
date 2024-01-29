'use strict';

// Constansts
const {
  PER_PAGE_LIMIT
} = require('../../constants');

// Components
const CaseHome = require('../../components/CaseHome');

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
      const page = new CaseHome({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
