'use strict';
// Components

module.exports = function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    }
  });
};
