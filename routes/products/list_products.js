'use strict';

// Components
const CaseHome = require('../../components/CaseHome');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      res.send(this.products);
    },
    html: () => {
      // TODO: import auth token, load data
      const page = new CaseHome({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
