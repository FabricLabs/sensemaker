'use strict';

/**
 * POST /tasks/:id/work — play or pause background work for this task.
 * Body: { action: 'play' | 'pause' }
 */
module.exports = async function (req, res) {
  if (!req.user || req.user.id == null) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const action = req.body && req.body.action;
  if (action !== 'play' && action !== 'pause') {
    return res.status(400).json({ error: 'action must be play or pause' });
  }

  try {
    const result = action === 'pause'
      ? await this.pauseBackgroundTask(req.params.id, req.user.id)
      : await this.playBackgroundTask(req.params.id, req.user.id);

    if (result && result.error === 'not_found') return res.status(404).json({ error: 'Task not found.' });
    if (result && result.error === 'forbidden') return res.status(403).json({ error: 'You do not have permission to edit this task.' });
    if (result && result.error === 'complete') return res.status(400).json({ error: 'Task already completed.' });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
};
