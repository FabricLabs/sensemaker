'use strict';

const crypto = require('crypto');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const now = new Date();
  const proposal = req.body;;

  if (!proposal.content) return res.status(400).json({ error: 'Missing content.' });

  proposal.created = now.toISOString();
  proposal.nonce = crypto.randomBytes(64).toString('hex');

  const actor = new Actor(proposal);
  const inserted = await this.db('sources').insert({
    id: actor.id,
    content: proposal.content,
    status: 'active'
  });

  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: () => {
      res.json({
        id: actor.id
      });
    }
  });
};
