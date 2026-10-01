'use strict';

/**
 * Base URL for the configured Ollama instance (used to proxy tags/version).
 */
function ollamaBaseUrl (settings = {}) {
  const o = settings.ollama || {};
  const host = o.host || 'localhost';
  const port = o.port != null ? o.port : 11434;
  return `http${o.secure ? 's' : ''}://${host}:${port}`;
}

module.exports = { ollamaBaseUrl };
