'use strict';

module.exports = async function (req, res, next) {
  if (!req.user || req.user.id == null) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const files = await this.db('files').where({ owner: req.user.id });
  res.send(files);
};
