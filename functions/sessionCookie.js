'use strict';

const { SESSION_TTL_SECONDS } = require('./redisSessions');

/**
 * Session cookie flags for Bearer token storage.
 * maxAge keeps the cookie across reloads for the same lifetime as the Redis session.
 * @param {object} [req]
 * @returns {{ httpOnly: boolean, sameSite: string, secure: boolean, path: string, maxAge: number }}
 */
function sessionCookieOptions (req) {
  const xf = req && req.headers && req.headers['x-forwarded-proto'];
  const proto = Array.isArray(xf) ? xf[0] : xf;
  const forwarded = String(proto || '').split(',')[0].trim().toLowerCase();
  const secure = !!(req && (req.secure || forwarded === 'https'));
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    maxAge: SESSION_TTL_SECONDS * 1000
  };
}

module.exports = {
  sessionCookieOptions
};
