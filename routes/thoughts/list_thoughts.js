'use strict';

/**
 * GET /thoughts?subject=&id= — agent-to-agent transcript for one task,
 * conversation, goal, agent, or source.
 */
module.exports = async function listThoughts (req, res) {
  if (!req.user || req.user.id == null) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const subject = req.query && req.query.subject ? String(req.query.subject) : '';
  const id = req.query && req.query.id != null ? String(req.query.id) : '';
  if (!subject || !id) {
    return res.status(400).json({ error: 'subject and id are required.' });
  }

  try {
    const result = await this.thoughtsForViewer(req.user, subject, id);
    if (result && result.error === 'not_found') return res.status(404).json({ error: 'Not found.' });
    if (result && result.error === 'forbidden') {
      return res.status(403).json({ error: 'You do not have permission to view this thought process.' });
    }
    return res.json({ thoughts: (result && result.thoughts) || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
};
