'use strict';

const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const now = new Date();
  const { task } = req.body;

  if (!task) {
    return res.status(400).json({ message: 'Task is required.' });
  }

  const creator = await this.db('users').where('id', req.user.id).first();
  const content = {
    created: now.toISOString(),
    title: task,
    creator: creator.fabric_id,
    owner: creator.fabric_id
  };

  const actor = new Actor(content);
  const inserted = await this.db('tasks').insert({
    title: task,
    fabric_id: actor.id,
    creator: req.user.id,
    owner: req.user.id
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
