'use strict';

module.exports = async function (req, res, next) {
  const files = await this.db('files').select('*');
  res.send(files);
};
