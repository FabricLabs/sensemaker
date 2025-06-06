'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      const task = await this.db('tasks').select('fabric_id as id', 'title', 'description', 'created_at', 'due_date', 'recommendation').where('fabric_id', req.params.id).first();
      if (!task) return res.status(404).json({ message: 'Task not found.' });
      return res.send(task);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
