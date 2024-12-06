'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const proposal = merge({}, req.body);
  const actor = new Actor(proposal);
  console.debug('[SENSEMAKER]', 'Creating activity:', proposal);

  // TODO: add sha256
  const blobs = await this.db('blobs').insert({
    fabric_id: actor.id,
    content: JSON.stringify(proposal)
  });
  console.debug('blobs:', blobs);

  res.send({ message: 'Activity created!' });
};
