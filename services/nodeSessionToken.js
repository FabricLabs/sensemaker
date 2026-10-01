'use strict';

/**
 * Node-signed **HTTP session** proofs (Fabric `Key`, BIP340 Schnorr over sha256(payload)).
 *
 * These JSON fields are **Token wire semantics** for this app — not Fabric message opcodes.
 * Fabric uses opcodes on the wire protocol; `cap` / `caps[]` here only describe this session Token.
 *
 * Multiple space-separated Bearer segments verify independently; capabilities merge (same `sub` only).
 */

const { tryParseJsonBounded } = require('@fabric/core/functions/wireJson');
const Token = require('@fabric/core/types/token');

/** Max JSON characters for session payload (after base64 decode). */
const SESSION_PAYLOAD_MAX_CHARS = 8192;

const AUD = 'sensemaker-http';

/** Value of signed payload field `cap`: identifies this blob as an HTTP session token. */
const TOKEN_KIND_SESSION = 'CAP_SESSION';
const LEGACY_TOKEN_KIND_SESSION = 'OP_SESSION';

/** Session capabilities in `caps[]` (Token only; not Fabric opcodes). */
const CAP_IDENTITY = 'CAP_IDENTITY';
const CAP_ADMIN = 'CAP_ADMIN';
const LEGACY_CAP_IDENTITY = 'OP_IDENTITY';
const LEGACY_CAP_ADMIN = 'OP_ADMIN';

/** @deprecated Use {@link TOKEN_KIND_SESSION}; kept for callers that still read `CAP_SESSION`. */
const CAP_SESSION = TOKEN_KIND_SESSION;

function issuerPubHex (key) {
  if (!key) return null;
  return key.public ? key.public.encodeCompressed('hex') : key.keypair.getPublic(true, 'hex');
}

function normalizeCapabilities (caps) {
  if (!Array.isArray(caps)) return [];
  const out = [];
  const seen = new Set();
  for (const c of caps) {
    if (typeof c !== 'string') continue;
    let n = c;
    if (c === LEGACY_CAP_IDENTITY) n = CAP_IDENTITY;
    else if (c === LEGACY_CAP_ADMIN) n = CAP_ADMIN;
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

function tokenKindIsSession (capField) {
  return capField === TOKEN_KIND_SESSION || capField === LEGACY_TOKEN_KIND_SESSION;
}

/**
 * Canonical JSON for signing (stable key order and sorted role/cap arrays).
 */
function canonicalSessionPayload ({ iss, sub, iat, exp, roles, caps }) {
  return JSON.stringify({
    aud: AUD,
    cap: TOKEN_KIND_SESSION,
    caps: caps.slice().sort(),
    exp,
    iat,
    iss,
    roles: roles.slice().sort(),
    sub: String(sub)
  });
}

/**
 * @param {Key} nodeKey
 * @param {object} opts
 * @param {string|number} opts.subject - user id
 * @param {string[]} [opts.roles]
 * @param {boolean} [opts.isAdmin] - if true, includes {@link CAP_ADMIN} when DB also says admin at issuance
 * @param {number} [opts.expiresInSeconds]
 */
function issueNodeSessionToken (nodeKey, opts = {}) {
  if (!nodeKey || !nodeKey.private) {
    throw new Error('issueNodeSessionToken requires the node root Key with private material.');
  }
  const expiresInSeconds = opts.expiresInSeconds != null ? opts.expiresInSeconds : 7 * 24 * 3600;
  const iss = issuerPubHex(nodeKey);
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const baseRoles = Array.isArray(opts.roles) ? opts.roles.slice() : ['user'];
  const caps = [CAP_IDENTITY];
  if (opts.isAdmin) {
    caps.push(CAP_ADMIN);
    if (!baseRoles.includes('admin')) baseRoles.unshift('admin');
  }
  const payloadStr = canonicalSessionPayload({
    iss,
    sub: opts.subject,
    iat,
    exp,
    roles: baseRoles,
    caps
  });
  const sig = nodeKey.sign(payloadStr);
  const payloadB64 = Token.base64UrlEncode(payloadStr);
  const sigB64 = Token.base64UrlEncodeBuffer(Buffer.isBuffer(sig) ? sig : Buffer.from(sig));
  return `${payloadB64}.${sigB64}`;
}

/**
 * @param {string} wire - `base64url(payloadJson).base64url(sig)`
 * @param {Key} nodeKey verification uses this node's public key
 * @returns {object|null} parsed payload fields (capabilities normalized to canonical strings)
 */
function verifyNodeSessionToken (wire, nodeKey) {
  if (!wire || typeof wire !== 'string' || !nodeKey) return null;
  const dotCount = (wire.match(/\./g) || []).length;
  if (dotCount !== 1) return null;
  const parts = wire.split('.');
  let payloadStr;
  try {
    payloadStr = Token.base64UrlDecode(parts[0]);
  } catch {
    return null;
  }
  if (!payloadStr || payloadStr.length > SESSION_PAYLOAD_MAX_CHARS) return null;
  const pr = tryParseJsonBounded(payloadStr, SESSION_PAYLOAD_MAX_CHARS);
  if (!pr.ok) return null;
  const payload = pr.value;
  if (!payload || typeof payload !== 'object') return null;
  if (payload.aud !== AUD) return null;
  if (!tokenKindIsSession(payload.cap)) return null;
  if (typeof payload.sub !== 'string' && typeof payload.sub !== 'number') return null;
  if (payload.exp == null || payload.iat == null) return null;
  if (Date.now() / 1000 > Number(payload.exp)) return null;
  const ourIss = issuerPubHex(nodeKey);
  if (!ourIss || payload.iss !== ourIss) return null;
  let sigBuf;
  try {
    sigBuf = Token.base64UrlDecodeToBuffer(parts[1]);
  } catch {
    return null;
  }
  if (!nodeKey.verify(payloadStr, sigBuf)) return null;

  const rawCaps = Array.isArray(payload.caps) ? payload.caps : [];

  return {
    sub: String(payload.sub),
    roles: Array.isArray(payload.roles) ? payload.roles : [],
    caps: normalizeCapabilities(rawCaps),
    iat: payload.iat,
    exp: payload.exp
  };
}

function extractBearerWires (authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') return [];
  const m = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return [];
  return m[1].trim().split(/\s+/).filter(Boolean);
}

/**
 * Verify one or more node-signed session tokens and merge roles/caps (same subject only).
 * @returns {{ id: number, sub: string, roles: string[], caps: string[], sessionTrust: 'node-signed' }|null}
 */
function mergeVerifiedBearerTokens (authorizationHeader, nodeKey) {
  const wires = extractBearerWires(authorizationHeader);
  if (!wires.length || !nodeKey) return null;

  let sub = null;
  const roles = new Set();
  const caps = new Set();
  let any = false;

  for (const wire of wires) {
    const parsed = verifyNodeSessionToken(wire, nodeKey);
    if (!parsed) continue;
    if (sub === null) sub = parsed.sub;
    if (String(parsed.sub) !== String(sub)) continue;
    any = true;
    parsed.roles.forEach((r) => roles.add(r));
    parsed.caps.forEach((c) => caps.add(c));
  }

  if (!any || sub === null) return null;
  const idNum = parseInt(sub, 10);
  return {
    id: Number.isFinite(idNum) ? idNum : null,
    sub,
    roles: [...roles],
    caps: [...caps],
    sessionTrust: 'node-signed'
  };
}

/**
 * @param {string[]|undefined} caps — canonical strings (e.g. after {@link verifyNodeSessionToken})
 * @returns {boolean}
 */
function capsIncludeAdmin (caps) {
  return Array.isArray(caps) && caps.includes(CAP_ADMIN);
}

module.exports = {
  AUD,
  TOKEN_KIND_SESSION,
  LEGACY_TOKEN_KIND_SESSION,
  CAP_SESSION,
  CAP_IDENTITY,
  CAP_ADMIN,
  LEGACY_CAP_IDENTITY,
  LEGACY_CAP_ADMIN,
  capsIncludeAdmin,
  issueNodeSessionToken,
  verifyNodeSessionToken,
  mergeVerifiedBearerTokens,
  extractBearerWires,
  issuerPubHex,
  normalizeCapabilities,
  tokenKindIsSession
};
