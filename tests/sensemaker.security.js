'use strict';

const assert = require('assert');
const crypto = require('crypto');

const Sensemaker = require('../services/sensemaker');
const nodeSessionToken = require('../services/nodeSessionToken');

describe('Sensemaker Security', function () {
  describe('_userMiddleware', function () {
    it('initializes an anonymous user when no auth is provided', function (done) {
      const req = { headers: {} };
      const res = {};
      const ctx = { key: null, settings: {} };

      Sensemaker.prototype._userMiddleware.call(ctx, req, res, () => {
        assert.strictEqual(req.user.id, null);
        assert.strictEqual(req.user.sessionTrust, 'none');
        assert.strictEqual(req.user.is_admin, false);
        assert.deepStrictEqual(req.user.roles, []);
        assert.deepStrictEqual(req.user.caps, []);
        done();
      });
    });

    it('parses cookie headers and keeps the token for downstream auth checks', function (done) {
      const req = {
        headers: {
          cookie: 'foo=bar; token=abc123; hello=world'
        }
      };
      const res = {};
      const ctx = { key: null, settings: {} };

      Sensemaker.prototype._userMiddleware.call(ctx, req, res, () => {
        assert.strictEqual(req.cookies.token, 'abc123');
        assert.strictEqual(req.user.id, null);
        done();
      });
    });
  });

  describe('_userHasAdminAccess', function () {
    it('returns false when no authenticated user exists', async function () {
      const allowed = await Sensemaker.prototype._userHasAdminAccess.call({}, { user: null });
      assert.strictEqual(allowed, false);
    });

    it('returns false for non node-signed sessions', async function () {
      const req = {
        user: {
          id: 7,
          sessionTrust: 'legacy-hmac',
          caps: [nodeSessionToken.CAP_ADMIN]
        }
      };
      const allowed = await Sensemaker.prototype._userHasAdminAccess.call({}, req);
      assert.strictEqual(allowed, false);
    });

    it('returns true for node-signed sessions with CAP_ADMIN and DB admin row', async function () {
      const req = {
        user: {
          id: 7,
          sessionTrust: 'node-signed',
          caps: [nodeSessionToken.CAP_ADMIN]
        }
      };
      const ctx = {
        db: () => ({
          where: () => ({
            select: () => ({
              first: async () => ({ is_admin: 1 })
            })
          })
        })
      };
      const allowed = await Sensemaker.prototype._userHasAdminAccess.call(ctx, req);
      assert.strictEqual(allowed, true);
    });
  });

  describe('verifyMessage', function () {
    it('returns true when no signing key is configured', function () {
      const ctx = { settings: {} };
      const ok = Sensemaker.prototype.verifyMessage.call(ctx, {
        message: 'hello',
        signature: 'bad',
        timestamp: Date.now()
      });
      assert.strictEqual(ok, true);
    });

    it('accepts a valid HMAC signature', function () {
      const signingKey = 'test-signing-key';
      const message = 'payload';
      const timestamp = Date.now();
      const hmac = crypto.createHmac('sha256', signingKey);
      hmac.update(message);
      hmac.update(timestamp.toString());
      const signature = hmac.digest('hex');

      const ctx = { settings: { signingKey } };
      const ok = Sensemaker.prototype.verifyMessage.call(ctx, { message, signature, timestamp });
      assert.strictEqual(ok, true);
    });

    it('rejects an invalid HMAC signature', function () {
      const ctx = { settings: { signingKey: 'test-signing-key' } };
      const ok = Sensemaker.prototype.verifyMessage.call(ctx, {
        message: 'payload',
        signature: 'a'.repeat(64),
        timestamp: Date.now()
      });
      assert.strictEqual(ok, false);
    });
  });
});
