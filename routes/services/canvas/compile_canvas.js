'use strict';

const { compileCanvas } = require('../../../functions/compileCanvas');

module.exports = async function compileCanvasRoute (req, res) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  const source = req.body && req.body.source;
  const result = compileCanvas(source);
  if (!result.ok) {
    return res.status(400).json({ status: 'error', message: result.error });
  }

  return res.json({ status: 'ok', code: result.code });
};
