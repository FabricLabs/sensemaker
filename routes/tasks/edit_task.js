'use strict';

const { taskEditDelta } = require('../../functions/sensemakerTools');

module.exports = async function (req, res, next) {
  const { id } = req.params;
  const { body } = req;

  try {
    const prior = await this.db('tasks').where({ fabric_id: id }).first();
    if (!prior) return res.status(404).json({ error: 'Task not found.' });
    if (prior.owner != req.user.id) return res.status(403).json({ error: 'You do not have permission to edit this task.' });
    if (body.completed_at && prior.completed_at) return res.status(400).json({ error: 'Task already completed.' });

    const delta = taskEditDelta(body);

    // TODO: handle errors
    await this.db('tasks').where({ fabric_id: id }).update(delta);
    const task = await this.db('tasks').where({ fabric_id: id }).first();
    console.debug('updated task:', task);
    res.send(task);
  } catch (E) {
    res.status(500).json({ error: E.message });
  }
};
// 3600 IN DS 46694 13 1 949c5ca3aa95ae3d09dc967ee84a96cd2ad6512e
