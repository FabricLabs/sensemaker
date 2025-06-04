'use strict';

const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const now = new Date();
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  console.debug('request user:', req.user);

  const creator = await this.db('users').where('id', req.user.id).first();
  const content = {
    created: now.toISOString(),
    title: title,
    creator: creator.fabric_id,
    owner: creator.fabric_id
  };

  const actor = new Actor(content);
  const inserted = await this.db('tasks').insert({
    title: title,
    fabric_id: actor.id,
    creator: req.user.id,
    owner: req.user.id
  });

  const task = await this.db('tasks').where('fabric_id', actor.id).first();

  this.trainer.ingestDocument({
    content: JSON.stringify(task),
    metadata: { owner: req.user.id }
  });

  res.format({
    json: function () {
      res.send({ id: actor.id });
    },
    html: function () {
      res.redirect(`/tasks/${actor.id}`);
    }
  });
};
