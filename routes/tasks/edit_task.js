'use strict';

const toMySQLDatetime = require('../../functions/toMySQLDatetime');

module.exports = async function (req, res, next) {
  const { id } = req.params;
  const { body } = req;

  try {
    const prior = await this.db('tasks').where({ fabric_id: id }).first();
    if (!prior) return res.status(404).json({ error: 'Task not found.' });
    if (prior.owner != req.user.id) return res.status(403).json({ error: 'You do not have permission to edit this task.' });
    if (body.completed_at && prior.completed_at) return res.status(400).json({ error: 'Task already completed.' });

    const delta = {};

    if (body.title) delta.title = body.title;
    if (body.description) delta.description = body.description;
    if (body.due_date) delta.due_date = body.due_date;
    if (body.status) delta.status = body.status;
    if (body.priority) delta.priority = body.priority;
    if (body.assigned_to) delta.assigned_to = body.assigned_to;
    if (body.assigned_by) delta.assigned_by = body.assigned_by;
    if (body.tags) delta.tags = body.tags;
    if (body.notes) delta.notes = body.notes;
    if (body.completed_at) { delta.completed_at = toMySQLDatetime(new Date(body.completed_at)) };
    if (body.completed_by) delta.completed_by = body.completed_by;

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
