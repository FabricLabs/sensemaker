'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      res.send(this.products);
    },
    html: () => {
      return res.send(this.applicationString);
    }
  });
};
