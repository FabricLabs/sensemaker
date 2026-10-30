'use strict';

const crypto = require('crypto');

/** Redis key prefix for HTTP login sessions. */
const PREFIX = 'sensemaker:http-session:';

/** Matches the node-signed session token lifetime. */
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Settings for `@fabric/core/services/redis`. A username and password become a
 * `url`, which is the option that service uses for authenticated servers.
 * @param {object} [redisSettings]
 * @returns {{ host: string, port: number, url?: string }}
 */
function fabricRedisConnectionSettings (redisSettings) {
  const settings = redisSettings || {};
  if (settings.url) {
    return { url: String(settings.url) };
  }
  const host = settings.host || '127.0.0.1';
  const port = Number(settings.port) || 6379;
  const username = settings.username ? String(settings.username) : '';
  const password = settings.password ? String(settings.password) : '';
  if (username && password) {
    const user = encodeURIComponent(username);
    const pass = encodeURIComponent(password);
    return {
      host: host,
      port: port,
      url: `redis://${user}:${pass}@${host}:${port}`
    };
  }
  return { host: host, port: port };
}

function sessionKey (token) {
  const digest = crypto.createHash('sha256').update(String(token)).digest('hex');
  return PREFIX + digest;
}

/**
 * @param {object} redis Fabric Redis command client (`service.socket`)
 * @returns {{ save: Function, get: Function, destroy: Function }}
 */
/**
 * Turn a Fabric Redis `message` event back into the channel name and UTF-8 body.
 * @param {object} msg
 * @returns {{ topic: string, text: string }|null}
 */
function decodeFabricRedisPayload (msg) {
  let data = msg && msg.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (err) {
      return null;
    }
  }
  if (!data || !data.topic || data.message == null) return null;
  return {
    topic: String(data.topic),
    text: Buffer.from(String(data.message), 'hex').toString('utf8')
  };
}

function createRedisSessionStore (redis) {
  return {
    /**
     * @param {string} token
     * @param {{ userId: number|string, exp: number, iat: number }} record
     * @param {number} [ttlSeconds]
     */
    async save (token, record, ttlSeconds) {
      const ttl = Math.max(1, Math.floor(Number(ttlSeconds) || SESSION_TTL_SECONDS));
      const body = JSON.stringify({
        userId: record.userId,
        exp: record.exp,
        iat: record.iat
      });
      await redis.set(sessionKey(token), body, { EX: ttl });
    },

    /**
     * @param {string} token
     * @returns {Promise<object|null>}
     */
    async get (token) {
      if (!token) return null;
      const raw = await redis.get(sessionKey(token));
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.userId == null) return null;
        return parsed;
      } catch (err) {
        return null;
      }
    },

    /**
     * @param {string} token
     */
    async destroy (token) {
      if (!token) return;
      await redis.del(sessionKey(token));
    }
  };
}

module.exports = {
  PREFIX,
  SESSION_TTL_SECONDS,
  createRedisSessionStore,
  decodeFabricRedisPayload,
  fabricRedisConnectionSettings,
  sessionKey
};
