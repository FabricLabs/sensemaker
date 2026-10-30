'use strict';

/**
 * GET /workers/state — local active worker queue snapshot (depth, busy, idle).
 * Future: Fabric-registered work contracts for paid parallel execution will extend this namespace.
 */
module.exports = async function (req, res) {
  if (!req.user || req.user.id == null) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const q = this.activeWorkerQueue;
  if (!q) {
    return res.json({
      ok: true,
      worker: false,
      nodeName: this.settings.name,
      queueDepth: 0,
      busy: false,
      jobKind: null,
      playnetBitcoinReady: !!(this.playnet && this.playnet.bitcoin)
    });
  }
  let queueDepth = 0;
  try {
    queueDepth = await q.queueDepth();
  } catch (e) {
    queueDepth = -1;
  }
  const snap = q.snapshotSync();
  const playnetBtc = this.playnet && this.playnet.bitcoin;
  const focus = this._workerFocus || null;
  let task = null;
  const taskId = req.query && req.query.task;
  if (taskId && this.db) {
    try {
      const row = await this.db('tasks').where({ fabric_id: String(taskId), owner: req.user.id }).first();
      if (row && typeof this.presentTaskWorker === 'function') {
        let goalTitle = null;
        if (row.plan_step_id) {
          const step = await this.db('plan_steps').where({ id: row.plan_step_id }).first();
          const plan = step ? await this.db('plans').where({ id: step.plan_id }).first() : null;
          const objective = plan ? await this.db('objectives').where({ id: plan.objective_id }).first() : null;
          goalTitle = objective ? objective.title : null;
        }
        task = this.presentTaskWorker(row, { goalTitle: goalTitle });
      }
    } catch (error) {
      task = null;
    }
  }
  return res.json({
    ok: true,
    worker: true,
    nodeName: this.settings.name,
    queueDepth,
    busy: snap.busy,
    idleMs: snap.idleMs,
    transport: snap.mode,
    jobKind: this._workerJobKind || null,
    focus: focus,
    task: task,
    playnetBitcoinReady: !!(playnetBtc && typeof playnetBtc._makeRPCRequest === 'function')
  });
};
