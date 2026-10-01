'use strict';

/**
 * Basics tied to SECURITY.md § Adversarial environment.
 */

const assert = require('assert');
const Sensemaker = require('../services/sensemaker');

describe('adversarialEnvironment.basics (Sensemaker)', function () {
  it('does not grant admin access without an authenticated user', async function () {
    const allowed = await Sensemaker.prototype._userHasAdminAccess.call({}, { user: null });
    assert.strictEqual(allowed, false);
  });

  it('initializes anonymous users with no roles or caps', function (done) {
    const req = { headers: {} };
    const res = {};
    const ctx = { key: null, settings: {} };
    Sensemaker.prototype._userMiddleware.call(ctx, req, res, () => {
      assert.strictEqual(req.user.id, null);
      assert.strictEqual(req.user.is_admin, false);
      assert.deepStrictEqual(req.user.roles, []);
      assert.deepStrictEqual(req.user.caps, []);
      done();
    });
  });

  it('does not grant admin from forged X-Forwarded-For or spoofed roles', async function () {
    const denied = await Sensemaker.prototype._userHasAdminAccess.call({}, {
      user: {
        id: 'u1',
        is_admin: true,
        roles: ['admin'],
        caps: ['CAP_ADMIN'],
        headers: { 'x-forwarded-for': '127.0.0.1' }
      }
    });
    assert.strictEqual(denied, false, 'missing node-signed session must not grant admin');
  });
});
