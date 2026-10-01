'use strict';

/**
 * Session cookie flags for Bearer token storage.
 * @param {object} [req]
 * @returns {{ httpOnly: boolean, sameSite: string, secure: boolean, path: string }}
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
    path: '/'
  };
}

module.exports = {
  sessionCookieOptions
};
