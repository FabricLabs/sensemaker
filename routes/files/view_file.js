'use strict';

module.exports = async function (req, res, next) {
  const file = await this.db('files').select('*').where({ id: req.params.id }).first();
  res.send(file);
}
