'use strict';

const always = [
  { id: 1, type: 'Task', mime: 'text/plain', title: 'DO NO HARM TO HUMANS', description: 'DO NO HARM TO HUMANS' }
];

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      const tasks = await this.db('tasks').select('fabric_id as id', 'title', 'description', 'created_at', 'due_date').where('owner', req.user.id);
      return res.send(always.concat(tasks));
    },
    html: () => {
      return res.send(this.applicationString);
    }
  })
};
