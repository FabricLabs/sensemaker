'use strict';

const always = [
  // { id: 1, type: 'Task', mime: 'text/plain', title: 'DO NO HARM TO HUMANS', description: 'DO NO HARM TO HUMANS', completed_at: true }
];

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      const tasks = await this.db('tasks').where('owner', req.user.id).orderBy('created_at', 'desc');

      const endowments = tasks.map((row) => {
        return {
          id: row.fabric_id,
          title: row.title,
          description: row.description,
          created_at: row.created_at,
          due_date: row.due_date,
          completed_at: row.completed_at,
          progress_note: row.progress_note || null,
          last_progress_at: row.last_progress_at || null,
          plan_step_id: row.plan_step_id || null,
          can_edit: true,
          can_delete: true,
          worker: this.presentTaskWorker(row)
        };
      });

      return res.send(always.concat(endowments));
    },
    html: () => {
      return res.send(this.applicationString);
    }
  })
};
