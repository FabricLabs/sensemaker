'use strict';

const assert = require('assert');
const { createRedisSessionStore, decodeFabricRedisPayload, fabricRedisConnectionSettings, sessionKey } = require('../../functions/redisSessions');

function memoryRedis () {
  const map = new Map();
  return {
    map: map,
    async set (key, value, opts) {
      map.set(key, { value: value, ex: opts && opts.EX });
    },
    async get (key) {
      const row = map.get(key);
      return row ? row.value : null;
    },
    async del (key) {
      map.delete(key);
    }
  };
}

describe('redis sessions', function () {
  it('saves a session under a hash of the token and reads it back', async function () {
    const redis = memoryRedis();
    const store = createRedisSessionStore(redis);
    const token = 'payload.signature';
    await store.save(token, { userId: 4, exp: 99, iat: 1 }, 60);
    const row = await store.get(token);
    assert.strictEqual(row.userId, 4);
    assert.strictEqual(row.exp, 99);
    assert.strictEqual(redis.map.get(sessionKey(token)).ex, 60);
    assert.strictEqual(redis.map.has(token), false);
  });

  it('builds Fabric Redis settings with host and port when there is no password', function () {
    const settings = fabricRedisConnectionSettings({ host: '127.0.0.1', port: 6379, username: 'default' });
    assert.strictEqual(settings.host, '127.0.0.1');
    assert.strictEqual(settings.port, 6379);
    assert.strictEqual(settings.url, undefined);
  });

  it('passes an authenticated url through to the Fabric Redis service', function () {
    const settings = fabricRedisConnectionSettings({
      host: '127.0.0.1',
      port: 6379,
      username: 'default',
      password: 'secret'
    });
    assert.strictEqual(settings.url, 'redis://default:secret@127.0.0.1:6379');
  });

  it('decodes a Fabric Redis channel message', function () {
    const body = JSON.stringify({ job: { method: 'IngestFile' } });
    const payload = decodeFabricRedisPayload({
      data: JSON.stringify({
        topic: 'job:completed',
        message: Buffer.from(body).toString('hex'),
        encoding: 'hex'
      })
    });
    assert.strictEqual(payload.topic, 'job:completed');
    assert.strictEqual(payload.text, body);
  });

  it('returns null for a missing or destroyed session', async function () {
    const store = createRedisSessionStore(memoryRedis());
    assert.strictEqual(await store.get('missing'), null);
    await store.save('payload.signature', { userId: 1, exp: 2, iat: 1 }, 10);
    await store.destroy('payload.signature');
    assert.strictEqual(await store.get('payload.signature'), null);
  });
});
