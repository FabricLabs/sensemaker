'use strict';

const { decideTaskEdit } = require('../../functions/sensemakerTools');

/**
 * Approve or discard a pending task edit. The stored patch is written only
 * on approve, and only by the task owner.
 * @param {string} decision `approve` or `reject`
 * @returns {function}
 */
module.exports = function decideTaskEditRoute (decision) {
  return async function (req, res) {
    if (!req.user || req.user.id == null) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const result = await decideTaskEdit(this.db, {
      userId: req.user.id,
      taskId: req.params.id,
      editId: req.params.editId,
      decision: decision
    });
    if (result.error === 'not_found') return res.status(404).json({ error: 'Edit not found.' });
    if (result.error === 'forbidden') return res.status(403).json({ error: 'You do not have permission to edit this task.' });
    if (result.error === 'not_pending') return res.status(409).json({ error: 'This edit is no longer pending.' });
    if (result.error === 'empty_patch') return res.status(400).json({ error: 'This edit has no applicable changes.' });
    return res.send(result);
  };
};
