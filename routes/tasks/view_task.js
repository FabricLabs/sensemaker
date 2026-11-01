'use strict';

const { listPendingTaskEdits } = require('../../functions/sensemakerTools');

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      const row = await this.db('tasks').where('fabric_id', req.params.id).first();
      if (!row) return res.status(404).json({ message: 'Task not found.' });
      if (req.user && row.owner != null && String(row.owner) !== String(req.user.id)) {
        return res.status(403).json({ message: 'You do not have permission to view this task.' });
      }
      let goal = null;
      try {
        if (row.plan_step_id) {
          const step = await this.db('plan_steps').where({ id: row.plan_step_id }).first();
          const plan = step ? await this.db('plans').where({ id: step.plan_id }).first() : null;
          const objective = plan ? await this.db('objectives').where({ id: plan.objective_id }).first() : null;
          if (objective) {
            goal = { id: objective.preimage_sha256, title: objective.title, status: objective.status };
          }
        }
      } catch (error) {
        goal = null;
      }
      const pendingEdits = req.user && String(row.owner) === String(req.user.id)
        ? await listPendingTaskEdits(this.db, row.fabric_id)
        : [];
      return res.send({
        id: row.fabric_id,
        title: row.title,
        description: row.description,
        created_at: row.created_at,
        due_date: row.due_date,
        completed_at: row.completed_at || null,
        recommendation: row.recommendation || null,
        progress_note: row.progress_note || null,
        last_progress_at: row.last_progress_at || null,
        plan_step_id: row.plan_step_id || null,
        goal: goal,
        pending_edits: pendingEdits,
        worker: this.presentTaskWorker(row, { goalTitle: goal && goal.title })
      });
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
