'use strict';

const { OAuthError } = require('../services/oauth');

/**
 * Send an OAuth error body (RFC 6749 §5.2 shape) or a generic 500.
 * @param {Object} res
 * @param {Error} err
 */
function sendOAuthError (res, err) {
  if (err instanceof OAuthError) {
    if (err.status === 401) res.set('WWW-Authenticate', `Bearer error="${err.error}"`);
    return res.status(err.status).json(err.toJSON());
  }
  console.error('[SENSEMAKER:OAUTH]', err);
  return res.status(500).json({ error: 'server_error', error_description: 'Internal server error.' });
}

/**
 * @param {Object} service Sensemaker instance
 * @param {Object} res
 * @returns {Boolean} true when the provider is ready; otherwise a 503 was sent
 */
function ensureProvider (service, res) {
  if (service.oauth && service.oauth.ready) return true;
  res.status(503).json({
    error: 'temporarily_unavailable',
    error_description: 'Applications need Redis and the node key; one is unavailable.'
  });
  return false;
}

/**
 * @param {Object} req
 * @param {Object} res
 * @returns {Boolean} true when a signed-in user made the request; otherwise a 401 was sent
 */
function ensureSignedIn (req, res) {
  if (req.user && req.user.id != null && req.user.sessionTrust !== 'oauth') return true;
  res.status(401).json({ error: 'login_required', error_description: 'Sign in to continue.' });
  return false;
}

/**
 * Look up an Application by numeric id or client_id.
 * @param {Object} provider
 * @param {String} param
 */
async function findApplicationParam (provider, param) {
  const value = String(param || '');
  if (/^\d+$/.test(value)) return provider.store.findApplication(parseInt(value, 10));
  return provider.store.findApplicationByClientId(value);
}

/**
 * Browser-based (public) Applications call the token, userinfo, and discovery
 * endpoints cross-origin. They authenticate with tokens, never cookies.
 * @param {Object} res
 */
function allowCors (res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Max-Age', '600');
}

function preflight (req, res) {
  allowCors(res);
  res.status(204).end();
}

function noStore (res) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
}

/**
 * Serve the SPA for browsers, run `json` otherwise.
 */
function formatJson (service, res, json) {
  return res.format({
    json,
    html: () => res.send(service.applicationString)
  });
}

module.exports = {
  allowCors,
  ensureProvider,
  ensureSignedIn,
  findApplicationParam,
  formatJson,
  noStore,
  preflight,
  sendOAuthError
};
