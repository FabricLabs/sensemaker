'use strict';

const always = [
  { id: 1, type: 'Task', mime: 'text/plain', title: 'DO NO HARM TO HUMANS', description: 'DO NO HARM TO HUMANS', completed_at: true }
];

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      const tasks = await this.db('tasks').select(
        'fabric_id as id',
        'title',
        'description',
        'created_at',
        'due_date'
      ).where('owner', req.user.id);

      const endowments = tasks.map((task) => {
        task.can_edit = true;
        task.can_delete = true;
        return task;
      });

      return res.send(always.concat(endowments));
    },
    html: () => {
      return res.send(this.applicationString);
    }
  })
};
