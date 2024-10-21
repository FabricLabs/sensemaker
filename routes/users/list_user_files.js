'use strict';

module.exports = async function (req, res, next) {
  const files = await this.db('files').where({ owner: req.user.id });
  console.log('user files:', files);
  res.send(files);
};
