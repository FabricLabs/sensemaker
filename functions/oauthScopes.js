'use strict';

/**
 * Scopes an Application may request. `user` scopes only make sense with a
 * signed-in person behind the token, so client credentials never receive them.
 */
const SCOPES = {
  openid: { description: 'Confirm who you are (OpenID Connect).', user: true },
  profile: { description: 'Read your username and display name.', user: true },
  email: { description: 'Read your email address.', user: true },
  'documents:read': { description: 'Read your documents.', user: false },
  'conversations:read': { description: 'Read your conversations.', user: false },
  completions: { description: 'Send chat completion requests to Sensemaker.', user: false }
};

const SUPPORTED_SCOPES = Object.keys(SCOPES);
const USER_SCOPES = SUPPORTED_SCOPES.filter((name) => SCOPES[name].user);

/**
 * @param {String|String[]} input space-delimited scope string or list
 * @returns {String[]} unique known scopes, in input order
 */
function parseScope (input) {
  const list = Array.isArray(input) ? input : String(input || '').split(/\s+/);
  const out = [];
  for (const raw of list) {
    const name = String(raw || '').trim();
    if (!name || !SCOPES[name] || out.includes(name)) continue;
    out.push(name);
  }
  return out;
}

/**
 * @param {String[]} requested
 * @param {String[]} allowed
 * @returns {String[]}
 */
function intersectScopes (requested, allowed) {
  const set = new Set(parseScope(allowed));
  return parseScope(requested).filter((name) => set.has(name));
}

function formatScope (scopes) {
  return parseScope(scopes).join(' ');
}

module.exports = {
  SCOPES,
  SUPPORTED_SCOPES,
  USER_SCOPES,
  formatScope,
  intersectScopes,
  parseScope
};
