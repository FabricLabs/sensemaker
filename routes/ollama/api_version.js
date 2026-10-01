'use strict';

const fetch = require('cross-fetch');
const { ollamaBaseUrl } = require('../../services/ollamaUpstream');

module.exports = async function (req, res) {
  const base = ollamaBaseUrl(this.settings);
  try {
    const r = await fetch(`${base}/api/version`, { method: 'GET' });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'Upstream Ollama returned non-JSON from /api/version.' });
    }
    return res.status(r.status).json(data);
  } catch (err) {
    console.error('[OLLAMA:MIRROR]', '/api/version', err);
    return res.status(502).json({ error: err.message || String(err) });
  }
};
