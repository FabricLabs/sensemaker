'use strict';

/**
 * OAuth tokens issued to Applications.
 *
 * Access tokens are node-signed like HTTP session tokens (BIP340 over
 * sha256(payload)) but carry `aud: 'sensemaker-oauth'`, so a session check never
 * accepts them and they never carry session capabilities such as `CAP_ADMIN`.
 * ID tokens are compact JWS `ES256K` (RFC 8812) signed by the same node key and
 * published as a JWK for OpenID Connect clients.
 */

const crypto = require('crypto');
const Token = require('@fabric/core/types/token');
const { tryParseJsonBounded } = require('@fabric/core/functions/wireJson');
const { issuerPubHex } = require('./nodeSessionToken');
const { parseScope } = require('../functions/oauthScopes');

const AUD = 'sensemaker-oauth';
const TOKEN_KIND_ACCESS = 'CAP_OAUTH_ACCESS';
const ACCESS_PAYLOAD_MAX_CHARS = 4096;
const ID_TOKEN_ALG = 'ES256K';

function canonicalAccessPayload ({ iss, sub, azp, scope, iat, exp, jti }) {
  return JSON.stringify({
    aud: AUD,
    azp: String(azp),
    cap: TOKEN_KIND_ACCESS,
    exp,
    iat,
    iss,
    jti: String(jti),
    scope: parseScope(scope).sort().join(' '),
    sub: String(sub)
  });
}

/**
 * @param {Key} nodeKey
 * @param {Object} opts
 * @param {String|Number} opts.subject user id, or `app:<client_id>` for client credentials
 * @param {String} opts.clientId
 * @param {String[]|String} opts.scope
 * @param {Number} [opts.expiresInSeconds] default 3600
 * @returns {{ token: String, payload: Object }}
 */
function issueAccessToken (nodeKey, opts = {}) {
  if (!nodeKey || !nodeKey.private) throw new Error('issueAccessToken requires the node root Key with private material.');
  if (opts.subject == null) throw new Error('issueAccessToken requires subject.');
  if (!opts.clientId) throw new Error('issueAccessToken requires clientId.');
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (opts.expiresInSeconds != null ? opts.expiresInSeconds : 3600);
  const payloadStr = canonicalAccessPayload({
    iss: issuerPubHex(nodeKey),
    sub: opts.subject,
    azp: opts.clientId,
    scope: opts.scope,
    iat,
    exp,
    jti: crypto.randomBytes(16).toString('hex')
  });
  const sig = nodeKey.sign(payloadStr);
  const token = `${Token.base64UrlEncode(payloadStr)}.${Token.base64UrlEncodeBuffer(Buffer.from(sig))}`;
  return { token, payload: JSON.parse(payloadStr) };
}

/**
 * @param {String} wire
 * @param {Key} nodeKey
 * @returns {{ sub: String, clientId: String, scopes: String[], iat: Number, exp: Number, jti: String }|null}
 */
function verifyAccessToken (wire, nodeKey) {
  if (!wire || typeof wire !== 'string' || !nodeKey) return null;
  const parts = wire.split('.');
  if (parts.length !== 2) return null;
  let payloadStr;
  try {
    payloadStr = Token.base64UrlDecode(parts[0]);
  } catch (err) {
    return null;
  }
  if (!payloadStr || payloadStr.length > ACCESS_PAYLOAD_MAX_CHARS) return null;
  const parsed = tryParseJsonBounded(payloadStr, ACCESS_PAYLOAD_MAX_CHARS);
  if (!parsed.ok || !parsed.value || typeof parsed.value !== 'object') return null;
  const payload = parsed.value;
  if (payload.aud !== AUD || payload.cap !== TOKEN_KIND_ACCESS) return null;
  if (typeof payload.sub !== 'string' || typeof payload.azp !== 'string') return null;
  if (!Number.isFinite(payload.exp) || !Number.isFinite(payload.iat)) return null;
  if (Date.now() / 1000 > payload.exp) return null;
  if (payload.iss !== issuerPubHex(nodeKey)) return null;
  let sig;
  try {
    sig = Token.base64UrlDecodeToBuffer(parts[1]);
  } catch (err) {
    return null;
  }
  if (!nodeKey.verify(payloadStr, sig)) return null;
  return {
    sub: payload.sub,
    clientId: payload.azp,
    scopes: parseScope(payload.scope),
    iat: payload.iat,
    exp: payload.exp,
    jti: payload.jti
  };
}

/**
 * Opaque random secret (authorization codes, refresh tokens).
 * @returns {String}
 */
function randomToken () {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken (token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function nodePublicPoint (nodeKey) {
  const compressed = Buffer.from(issuerPubHex(nodeKey), 'hex');
  const uncompressed = crypto.ECDH.convertKey(compressed, 'secp256k1', null, null, 'uncompressed');
  const point = Buffer.isBuffer(uncompressed) ? uncompressed : Buffer.from(uncompressed);
  return { x: point.subarray(1, 33), y: point.subarray(33, 65) };
}

/**
 * RFC 7638 thumbprint of the node's secp256k1 JWK.
 * @param {Key} nodeKey
 * @returns {String}
 */
function nodeKeyId (nodeKey) {
  const { x, y } = nodePublicPoint(nodeKey);
  const canonical = JSON.stringify({ crv: 'secp256k1', kty: 'EC', x: x.toString('base64url'), y: y.toString('base64url') });
  return crypto.createHash('sha256').update(canonical).digest('base64url');
}

/**
 * Public JWK for the node key (OIDC `jwks_uri`).
 * @param {Key} nodeKey
 * @returns {Object}
 */
function nodeJwk (nodeKey) {
  const { x, y } = nodePublicPoint(nodeKey);
  return {
    kty: 'EC',
    crv: 'secp256k1',
    x: x.toString('base64url'),
    y: y.toString('base64url'),
    use: 'sig',
    alg: ID_TOKEN_ALG,
    kid: nodeKeyId(nodeKey)
  };
}

function nodePrivateKeyObject (nodeKey) {
  const jwk = nodeJwk(nodeKey);
  const d = Buffer.isBuffer(nodeKey.private)
    ? nodeKey.private
    : Buffer.from(String(nodeKey.private.toString(16)).padStart(64, '0'), 'hex');
  return crypto.createPrivateKey({
    format: 'jwk',
    key: { kty: 'EC', crv: 'secp256k1', x: jwk.x, y: jwk.y, d: d.toString('base64url') }
  });
}

/**
 * Sign an OpenID Connect ID token with the node key.
 * @param {Key} nodeKey
 * @param {Object} opts
 * @param {String} opts.issuer
 * @param {String} opts.subject
 * @param {String} opts.audience client_id
 * @param {String} [opts.nonce]
 * @param {Number} [opts.authTime]
 * @param {Object} [opts.claims] extra claims (profile, email)
 * @param {Number} [opts.expiresInSeconds] default 3600
 * @returns {String} compact JWS
 */
function issueIdToken (nodeKey, opts = {}) {
  if (!nodeKey || !nodeKey.private) throw new Error('issueIdToken requires the node root Key with private material.');
  const iat = Math.floor(Date.now() / 1000);
  const header = { alg: ID_TOKEN_ALG, typ: 'JWT', kid: nodeKeyId(nodeKey) };
  const body = Object.assign({}, opts.claims || {}, {
    iss: opts.issuer,
    sub: String(opts.subject),
    aud: opts.audience,
    azp: opts.audience,
    iat,
    exp: iat + (opts.expiresInSeconds != null ? opts.expiresInSeconds : 3600)
  });
  if (opts.nonce) body.nonce = opts.nonce;
  if (opts.authTime) body.auth_time = opts.authTime;
  const signingInput = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from(JSON.stringify(body)).toString('base64url')}`;
  const signature = crypto.sign('sha256', Buffer.from(signingInput), {
    key: nodePrivateKeyObject(nodeKey),
    dsaEncoding: 'ieee-p1363'
  });
  return `${signingInput}.${signature.toString('base64url')}`;
}

/**
 * Verify an ES256K ID token against a JWK (what an OIDC client does).
 * @param {String} jwt
 * @param {Object} jwk
 * @returns {Object|null} claims
 */
function verifyIdToken (jwt, jwk) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (header.alg !== ID_TOKEN_ALG) return null;
    const publicKey = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'secp256k1', x: jwk.x, y: jwk.y } });
    const valid = crypto.verify('sha256', Buffer.from(`${parts[0]}.${parts[1]}`), {
      key: publicKey,
      dsaEncoding: 'ieee-p1363'
    }, Buffer.from(parts[2], 'base64url'));
    if (!valid) return null;
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (Date.now() / 1000 > claims.exp) return null;
    return claims;
  } catch (err) {
    return null;
  }
}

/**
 * PKCE `S256` check (RFC 7636).
 * @param {String} verifier
 * @param {String} challenge
 * @returns {Boolean}
 */
function verifyPkce (verifier, challenge) {
  if (typeof verifier !== 'string' || !/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false;
  if (typeof challenge !== 'string' || !challenge) return false;
  const computed = crypto.createHash('sha256').update(verifier).digest('base64url');
  const a = Buffer.from(computed);
  const b = Buffer.from(challenge);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
  AUD,
  ID_TOKEN_ALG,
  TOKEN_KIND_ACCESS,
  hashToken,
  issueAccessToken,
  issueIdToken,
  nodeJwk,
  nodeKeyId,
  randomToken,
  verifyAccessToken,
  verifyIdToken,
  verifyPkce
};
