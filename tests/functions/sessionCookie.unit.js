'use strict';

const assert = require('assert');
const { sessionCookieOptions } = require('../../functions/sessionCookie');

describe('sessionCookieOptions', function () {
  it('sets HttpOnly and SameSite=strict', function () {
    const opts = sessionCookieOptions({});
    assert.strictEqual(opts.httpOnly, true);
    assert.strictEqual(opts.sameSite, 'strict');
    assert.strictEqual(opts.path, '/');
    assert.strictEqual(opts.secure, false);
  });

  it('sets Secure when the request is HTTPS or forwarded as https', function () {
    assert.strictEqual(sessionCookieOptions({ secure: true }).secure, true);
    assert.strictEqual(
      sessionCookieOptions({ headers: { 'x-forwarded-proto': 'https' } }).secure,
      true
    );
  });
});
