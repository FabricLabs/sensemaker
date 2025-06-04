'use strict';

const crypto = require('crypto');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const now = new Date();
  const proposal = req.body;;

  if (!proposal.name) return res.status(400).json({ error: 'Missing name.' });

  proposal.created = now.toISOString();
  proposal.nonce = crypto.randomBytes(64).toString('hex');

  const actor = new Actor(proposal);
  const inserted = await this.db('groups').insert({
    id: actor.id,
    name: proposal.name,
    description: proposal.description
  });

  if (!inserted) return res.status(500).json({ error: 'Could not create group.' });

  await this.db('group_members').insert({
    group_id: actor.id,
    user_id: req.user.id
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
