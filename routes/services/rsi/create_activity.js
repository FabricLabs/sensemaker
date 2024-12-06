'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const proposal = merge({}, req.body);
  const content = JSON.stringify(proposal, null, '  ');
  const actor = new Actor({ content: content });
  // TODO: add sha256
  const blobs = await this.db('blobs').insert({
    fabric_id: actor.id,
    content: JSON.stringify(proposal)
  });
  return res.send({ message: 'Activity created!' });
};
