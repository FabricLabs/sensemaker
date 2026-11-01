'use strict';

/**
 * Fabric client assertions: how a confidential Application proves itself to the
 * OAuth endpoints without a shared secret.
 *
 * Wire: `base64url(canonicalJSON(payload)) + '.' + hex(BIP340 signature)`, where
 * the signature is over sha256(canonicalJSON(payload)) with the key whose
 * compressed public key is registered on the Application (`applications.pubkey`).
 */

const crypto = require('crypto');
const Key = require('@fabric/core/types/key');
const Token = require('@fabric/core/types/token');
const { tryParseJsonBounded } = require('@fabric/core/functions/wireJson');

const ASSERTION_TYPE = 'urn:fabric:params:oauth:client-assertion-type:bip340';
const MAX_LIFETIME_SECONDS = 300;
const CLOCK_SKEW_SECONDS = 30;
const ASSERTION_MAX_CHARS = 2048;
const JTI_PREFIX = 'sensemaker:oauth-jti:';

function canonicalAssertionPayload ({ iss, sub, aud, iat, exp, jti }) {
  return JSON.stringify({
    aud: String(aud),
    exp: Number(exp),
    iat: Number(iat),
    iss: String(iss),
    jti: String(jti),
    sub: String(sub)
  });
}

/**
 * @param {Key} key Application key with private material
 * @param {Object} opts
 * @param {String} opts.clientId
 * @param {String} opts.audience token endpoint URL (or issuer)
 * @param {Number} [opts.lifetimeSeconds] default 60, at most 300
 * @param {String} [opts.jti]
 * @param {Number} [opts.now] seconds since epoch
 * @returns {String}
 */
function buildClientAssertion (key, opts = {}) {
  if (!key || !key.private) throw new Error('buildClientAssertion requires a Key with private material.');
  if (!opts.clientId) throw new Error('buildClientAssertion requires clientId.');
  if (!opts.audience) throw new Error('buildClientAssertion requires audience.');
  const lifetime = Math.min(MAX_LIFETIME_SECONDS, Math.max(1, Number(opts.lifetimeSeconds) || 60));
  const iat = opts.now != null ? Math.floor(opts.now) : Math.floor(Date.now() / 1000);
  const payloadStr = canonicalAssertionPayload({
    iss: opts.clientId,
    sub: opts.clientId,
    aud: opts.audience,
    iat,
    exp: iat + lifetime,
    jti: opts.jti || crypto.randomBytes(16).toString('hex')
  });
  const sig = key.signSchnorr(payloadStr);
  return `${Token.base64UrlEncode(payloadStr)}.${Buffer.from(sig).toString('hex')}`;
}

/**
 * Parse an assertion without checking its signature (to find which client sent it).
 * @param {String} wire
 * @returns {{ payload: Object, payloadStr: String, signature: Buffer }|null}
 */
function parseClientAssertion (wire) {
  if (!wire || typeof wire !== 'string' || wire.length > ASSERTION_MAX_CHARS) return null;
  const parts = wire.split('.');
  if (parts.length !== 2) return null;
  if (!/^[0-9a-fA-F]{128}$/.test(parts[1])) return null;
  let payloadStr;
  try {
    payloadStr = Token.base64UrlDecode(parts[0]);
  } catch (err) {
    return null;
  }
  const parsed = tryParseJsonBounded(payloadStr, ASSERTION_MAX_CHARS);
  if (!parsed.ok || !parsed.value || typeof parsed.value !== 'object') return null;
  return { payload: parsed.value, payloadStr, signature: Buffer.from(parts[1], 'hex') };
}

/**
 * @param {String} wire
 * @param {Object} opts
 * @param {String} opts.pubkey compressed secp256k1 public key (hex)
 * @param {String} opts.clientId
 * @param {String[]|String} opts.audience accepted `aud` values
 * @param {Number} [opts.now] seconds since epoch
 * @returns {{ ok: true, payload: Object }|{ ok: false, error: String }}
 */
function verifyClientAssertion (wire, opts = {}) {
  const parsed = parseClientAssertion(wire);
  if (!parsed) return { ok: false, error: 'Malformed client assertion.' };
  const { payload, payloadStr, signature } = parsed;
  const now = opts.now != null ? opts.now : Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(opts.audience) ? opts.audience : [opts.audience];

  if (payloadStr !== canonicalAssertionPayload(payload)) return { ok: false, error: 'Client assertion is not canonical.' };
  if (payload.iss !== opts.clientId || payload.sub !== opts.clientId) return { ok: false, error: 'Client assertion issuer does not match client_id.' };
  if (!audiences.includes(payload.aud)) return { ok: false, error: 'Client assertion audience is not this server.' };
  if (!Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) return { ok: false, error: 'Client assertion is missing iat or exp.' };
  if (payload.exp <= now) return { ok: false, error: 'Client assertion has expired.' };
  if (payload.iat > now + CLOCK_SKEW_SECONDS) return { ok: false, error: 'Client assertion was issued in the future.' };
  if (payload.exp - payload.iat > MAX_LIFETIME_SECONDS) return { ok: false, error: `Client assertion lifetime exceeds ${MAX_LIFETIME_SECONDS} seconds.` };
  if (typeof payload.jti !== 'string' || payload.jti.length < 16 || payload.jti.length > 128) return { ok: false, error: 'Client assertion jti must be 16 to 128 characters.' };

  let key;
  try {
    key = new Key({ public: opts.pubkey });
  } catch (err) {
    return { ok: false, error: 'Application public key is invalid.' };
  }

  let valid = false;
  try {
    valid = key.verifySchnorr(payloadStr, signature);
  } catch (err) {
    valid = false;
  }
  if (!valid) return { ok: false, error: 'Client assertion signature is invalid.' };
  return { ok: true, payload };
}

/**
 * Record an assertion id so it can be used once. Returns false on replay.
 * @param {Object} redis client with `set(key, value, { NX, EX })`
 * @param {String} clientId
 * @param {String} jti
 * @param {Number} exp seconds since epoch
 * @returns {Promise<Boolean>}
 */
async function claimAssertionId (redis, clientId, jti, exp) {
  const ttl = Math.max(1, Math.ceil(Number(exp) - Date.now() / 1000) + CLOCK_SKEW_SECONDS);
  const digest = crypto.createHash('sha256').update(`${clientId}:${jti}`).digest('hex');
  const result = await redis.set(JTI_PREFIX + digest, '1', { NX: true, EX: ttl });
  return result === 'OK';
}

module.exports = {
  ASSERTION_TYPE,
  MAX_LIFETIME_SECONDS,
  buildClientAssertion,
  canonicalAssertionPayload,
  claimAssertionId,
  parseClientAssertion,
  verifyClientAssertion
};
