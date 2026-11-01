'use strict';

const { parseScope } = require('./oauthScopes');

/**
 * Let OAuth access tokens reach one route handler.
 *
 * `_userMiddleware` only records a verified OAuth token on `req.oauth`; it never
 * signs the request in. Routes that are not wrapped here therefore treat an
 * OAuth bearer as anonymous. Signed-in sessions pass through unchanged.
 *
 * @param {String[]|String} scopes every scope the token must carry
 * @param {Function} handler route handler (already bound)
 * @returns {Function}
 */
function requireScope (scopes, handler) {
  const required = parseScope(scopes);
  return function scopedHandler (req, res, next) {
    const access = req.oauth;
    const hasSession = req.user && req.user.id != null && req.user.sessionTrust !== 'oauth';
    if (hasSession || !access) return handler(req, res, next);

    const missing = required.filter((name) => !access.scopes.includes(name));
    if (missing.length) {
      res.set('WWW-Authenticate', `Bearer error="insufficient_scope", scope="${required.join(' ')}"`);
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `This token is missing scope: ${missing.join(' ')}`
      });
    }

    req.user = {
      id: access.actingUserId,
      roles: ['user'],
      caps: [],
      state: {},
      sessionTrust: 'oauth',
      is_admin: false,
      application: access.clientId,
      scopes: access.scopes.slice()
    };
    return handler(req, res, next);
  };
}

module.exports = requireScope;
