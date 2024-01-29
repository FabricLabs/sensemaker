'use strict';

module.exports = async function (req, res, next) {
  // TODO: pagination
  return this.db('matters').where('creator', req.user.id);
};
