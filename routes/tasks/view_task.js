'use strict';

module.exports = async function (req, res, next) {
  const task = await this.db('tasks').select('fabric_id as id', 'title', 'description', 'created_at', 'due_date').where('fabric_id', req.params.id).first();
  if (!task) return res.statusCode(404).json({ message: 'Task not found.' });
  return res.send(task);
};
