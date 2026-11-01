'use strict';

const assert = require('assert');
const Key = require('@fabric/core/types/key');
const {
  buildClientAssertion,
  claimAssertionId,
  verifyClientAssertion
} = require('../../functions/fabricClientAssertion');

const AUDIENCE = 'https://sensemaker.test/oauth/token';

function memoryRedis () {
  const map = new Map();
  return {
    async set (key, value, opts = {}) {
      if (opts.NX && map.has(key)) return null;
      map.set(key, value);
      return 'OK';
    }
  };
}

describe('fabric client assertions', function () {
  const key = new Key();
  const pubkey = key.pubkey;

  it('verifies an assertion signed by the registered key', function () {
    const wire = buildClientAssertion(key, { clientId: 'client-1', audience: AUDIENCE });
    const result = verifyClientAssertion(wire, { pubkey, clientId: 'client-1', audience: AUDIENCE });
    assert.strictEqual(result.ok, true, result.error);
    assert.strictEqual(result.payload.iss, 'client-1');
  });

  it('rejects an assertion signed by another key', function () {
    const wire = buildClientAssertion(new Key(), { clientId: 'client-1', audience: AUDIENCE });
    const result = verifyClientAssertion(wire, { pubkey, clientId: 'client-1', audience: AUDIENCE });
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /signature/);
  });

  it('rejects an expired assertion', function () {
    const now = Math.floor(Date.now() / 1000);
    const wire = buildClientAssertion(key, { clientId: 'client-1', audience: AUDIENCE, now: now - 600, lifetimeSeconds: 60 });
    const result = verifyClientAssertion(wire, { pubkey, clientId: 'client-1', audience: AUDIENCE });
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /expired/);
  });

  it('rejects an assertion meant for another server', function () {
    const wire = buildClientAssertion(key, { clientId: 'client-1', audience: 'https://elsewhere.test/oauth/token' });
    const result = verifyClientAssertion(wire, { pubkey, clientId: 'client-1', audience: AUDIENCE });
    assert.strictEqual(result.ok, false);
    assert.match(result.error, /audience/);
  });

  it('rejects an assertion for another client_id', function () {
    const wire = buildClientAssertion(key, { clientId: 'client-2', audience: AUDIENCE });
    const result = verifyClientAssertion(wire, { pubkey, clientId: 'client-1', audience: AUDIENCE });
    assert.strictEqual(result.ok, false);
  });

  it('rejects a tampered payload', function () {
    const wire = buildClientAssertion(key, { clientId: 'client-1', audience: AUDIENCE });
    const [payload, sig] = wire.split('.');
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    body.exp += 100;
    const tampered = `${Buffer.from(JSON.stringify(body)).toString('base64url')}.${sig}`;
    const result = verifyClientAssertion(tampered, { pubkey, clientId: 'client-1', audience: AUDIENCE });
    assert.strictEqual(result.ok, false);
  });

  it('lets each assertion id be used once', async function () {
    const redis = memoryRedis();
    const exp = Math.floor(Date.now() / 1000) + 60;
    assert.strictEqual(await claimAssertionId(redis, 'client-1', 'a'.repeat(32), exp), true);
    assert.strictEqual(await claimAssertionId(redis, 'client-1', 'a'.repeat(32), exp), false);
    assert.strictEqual(await claimAssertionId(redis, 'client-2', 'a'.repeat(32), exp), true);
  });
});
