'use strict';

/**
 * Mount Fabric protocol HTTP surfaces on Sensemaker without replacing
 * password `/sessions` login.
 *
 * - Passport v2 sign-in (`@fabric/http` `passportHttp`), pinned to
 *   Sensemaker's own origins: `POST /sessions/challenges`, then
 *   `POST /sessions { assertion }`. `GET|DELETE /sessions/current` answer for a
 *   Passport session when the request carries one, else for the password
 *   session.
 * - Device-link: `POST|GET /device-links` (+ `…/signatures`).
 *
 * Password / credential token login stays `POST /sessions { username, password } | { token }`.
 */

const { createPassportRelyingParty } = require('@fabric/http/functions/passportRelyingParty');
const { createPassportHttp } = require('@fabric/http/functions/passportHttp');
const { mountFabricDeviceLinkHttp } = require('@fabric/hub/functions/fabricDeviceLink');

/**
 * True when the body is a Passport sign-in (a signed assertion), not
 * Sensemaker password / credential login.
 * @param {object|null|undefined} body
 * @returns {boolean}
 */
function isPassportSessionCreate (body) {
  if (!body || typeof body !== 'object') return false;
  if (body.username != null || body.password != null || body.token != null) return false;
  return typeof body.assertion === 'string' && /^fabric:/i.test(body.assertion.trim());
}

/**
 * Origins Passport may sign in to: `baseUrl`, `https://<domain>`, and
 * loopback on the HTTP port. The `Host` header never adds one.
 * @param {object} [settings] Sensemaker settings
 * @returns {string[]}
 */
function sensemakerPinnedOrigins (settings = {}) {
  const out = new Set();
  const add = (raw) => {
    try {
      if (raw) out.add(new URL(String(raw)).origin);
    } catch (_) {}
  };
  add(settings.baseUrl);
  if (settings.domain && /^[a-z0-9.-]+(:\d+)?$/i.test(String(settings.domain))) add(`https://${settings.domain}`);
  const port = Number((settings.http && settings.http.port) || settings.port || 3040);
  if (Number.isInteger(port) && port > 0) {
    for (const host of ['127.0.0.1', 'localhost', '[::1]']) out.add(`http://${host}:${port}`);
  }
  return [...out];
}

/**
 * @param {object} sensemaker Sensemaker / Hub-like instance with `http` and `settings`
 * @param {Function} passwordCreateHandler Bound create_session middleware
 * @param {Object} [handlers]
 * @param {Function} [handlers.current] Bound current_session middleware
 * @param {Function} [handlers.destroy] Bound destroy_session middleware
 * @returns {{ passport: boolean, deviceLink: boolean }}
 */
function mountFabricProtocolHttp (sensemaker, passwordCreateHandler, handlers = {}) {
  if (!sensemaker || !sensemaker.http || typeof sensemaker.http._addRoute !== 'function') {
    throw new Error('mountFabricProtocolHttp: sensemaker.http._addRoute required');
  }
  if (typeof passwordCreateHandler !== 'function') {
    throw new Error('mountFabricProtocolHttp: passwordCreateHandler required');
  }

  if (!sensemaker._deviceLinkSessions) sensemaker._deviceLinkSessions = new Map();
  // Device-link self-sign uses `_rootKey`.
  if (!sensemaker._rootKey && sensemaker.key) sensemaker._rootKey = sensemaker.key;
  if (!sensemaker.key && sensemaker._rootKey) sensemaker.key = sensemaker._rootKey;

  const settings = sensemaker.settings || {};
  const relyingParty = createPassportRelyingParty({
    pinnedOrigins: sensemakerPinnedOrigins(settings),
    network: null,
    purpose: `Sign in to ${settings.name || 'Sensemaker'}`
  });
  const passportHttp = createPassportHttp({ relyingParty });
  const route = (method, path) => passportHttp.routes.find((r) => r.method === method && r.path === path).handler;
  const createChallenge = route('POST', '/sessions/challenges');
  const createSession = route('POST', '/sessions');
  const currentSession = route('GET', '/sessions/current');
  const endSession = route('DELETE', '/sessions/current');

  sensemaker.http._addRoute('POST', '/sessions/challenges', createChallenge);

  // Dual-mode create: Passport assertion vs password/token (first Express match wins —
  // register only this handler for POST /sessions).
  sensemaker.http._addRoute('POST', '/sessions', (req, res, next) => {
    const body = (req && req.body && typeof req.body === 'object') ? req.body : {};
    if (isPassportSessionCreate(body)) return createSession(req, res);
    return passwordCreateHandler(req, res, next);
  });

  if (typeof handlers.current === 'function') {
    sensemaker.http._addRoute('GET', '/sessions/current', async (req, res, next) => {
      if (await passportHttp.readRequestSession(req)) return currentSession(req, res);
      return handlers.current(req, res, next);
    });
  }
  if (typeof handlers.destroy === 'function') {
    sensemaker.http._addRoute('DELETE', '/sessions/current', async (req, res, next) => {
      if (passportHttp.sessionToken(req) && await passportHttp.readRequestSession(req)) return endSession(req, res);
      return handlers.destroy(req, res, next);
    });
  }

  mountFabricDeviceLinkHttp(sensemaker);

  sensemaker._passport = { relyingParty, http: passportHttp };
  return { passport: true, deviceLink: true };
}

module.exports = {
  isPassportSessionCreate,
  sensemakerPinnedOrigins,
  mountFabricProtocolHttp
};
