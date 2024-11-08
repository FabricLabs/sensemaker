'use strict';

module.exports = async function (req, res, next) {
  const files = await this.db('files').select('*').where('creator', req.params.id);
  res.send(files);
};
