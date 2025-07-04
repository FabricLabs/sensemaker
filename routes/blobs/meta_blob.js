'use strict';

module.exports = async function (req, res, next) {
  const blob = await this.db('blobs').where('fabric_id', req.params.id).first();
  if (!blob) return res.status(404).send('Blob not found');
  res.json(blob);
};