'use strict';

module.exports = async function (req, res, next) {
  console.debug('Searching conversations...', req.body);
  const results = await this._searchConversations({ query: req.body.query });
  console.debug('results:', results);
  return res.send({ status: 'error', message: 'Not yet implemented.' });
};
