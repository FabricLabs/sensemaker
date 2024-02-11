'use strict';

// Components
const CaseHome = require('../../components/CaseHome');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      const matter = await this.db('matters').where('id', req.param.id).first();
      res.send(matter);
    },
    html: () => {
      // TODO: import auth token, load data
      const page = new CaseHome({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
