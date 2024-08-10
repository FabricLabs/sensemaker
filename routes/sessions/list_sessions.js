'use strict';

module.exports = function (req, res, next) {
  return res.send(this.http.app.render());
}
