'use strict';

const { sessionCookieOptions } = require('../../functions/sessionCookie');

module.exports = async function (req, res) {
  if (req.sessionToken && this.httpSessions) {
    try {
      await this.httpSessions.destroy(req.sessionToken);
    } catch (err) {
      console.error('[SENSEMAKER]', 'Failed to delete Redis session:', err.message || err);
    }
  }

  const cookie = sessionCookieOptions(req);
  res.clearCookie('token', {
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    secure: cookie.secure
  });
  res.json({ ok: true });
};
