'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: function () {
      res.send([]);
    },
    html: function () {
      return res.send(this.applicationString);
    },
  });
};
