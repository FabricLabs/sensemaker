'use strict';

/**
 * True when `text` is suitable for vector document sidebar search.
 * Assistant error payloads and stack traces make poor embeddings queries and pollute logs.
 */
function isChatSidebarSearchQuery (text) {
  if (text == null || typeof text !== 'string') return false;
  const t = text.trim();
  if (!t || t.length > 12000) return false;
  if (/^Error:\s*\{/i.test(t)) return false;
  if (t.includes('"type":"api_error"') || t.includes('"api_error"')) return false;
  if (t.includes('do load request') && t.includes('/load')) return false;
  if (t.includes('Query timed out after') && t.includes('ms')) return false;
  return true;
}

module.exports = isChatSidebarSearchQuery;
