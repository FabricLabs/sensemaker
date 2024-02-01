'use strict';

// // Constansts
// const {
//   PER_PAGE_LIMIT
// } = require('../../constants');

// Components
const MatterView = require('../../components/MatterView');

module.exports = function (req, res, next) {
   res.format({
    json: async () => {
      // TODO: pagination
      const matter = await this.db('matters').where('id', req.param.id).first();
      res.send(matter);
    },
    html: () => {
      // TODO: import auth token, load data
      const page = new MatterView({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
