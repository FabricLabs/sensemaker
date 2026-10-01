'use strict';

/**
 * One Pool member per Ollama HTTP endpoint. Duplicate host:port rows only overload the same server.
 */
function dedupeOllamaPoolMembers (members) {
  const seen = new Set();
  const out = [];
  for (const m of members) {
    const host = String(m.host || '').replace(/^https?:\/\//i, '').trim().toLowerCase();
    const port = Number(m.port != null ? m.port : 11434);
    const secure = !!m.secure;
    const key = `${secure ? 's' : 'h'}:${host}:${port}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

module.exports = dedupeOllamaPoolMembers;
