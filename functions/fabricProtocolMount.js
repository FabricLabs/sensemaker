'use strict';

/**
 * Mount Hub-compatible Fabric protocol HTTP surfaces on Sensemaker without
 * replacing password `/sessions` login.
 *
 * - D-011 client-signed login: POST /sessions { origin } → GET poll → POST …/signatures
 * - D-013 device-link: POST|GET /device-links (+ …/signatures)
 *
 * Password / credential token login remains POST /sessions { username, password } | { token }.
 */

const desktopAuth = require('@fabric/hub/functions/fabricDesktopAuth');
const { mountFabricDeviceLinkHttp } = require('@fabric/hub/functions/fabricDeviceLink');
const { mountFabricDelegationHttp } = require('@fabric/hub/functions/fabricDelegation');

/**
 * True when the body is a Hub-style desktop/player login session create
 * (not Sensemaker password / credential login).
 * @param {object|null|undefined} body
 * @returns {boolean}
 */
function isFabricDesktopSessionCreate (body) {
  if (!body || typeof body !== 'object') return false;
  if (body.username != null || body.password != null || body.token != null) return false;
  return typeof body.origin === 'string' && String(body.origin).trim().length > 0;
}

/**
 * @param {object} sensemaker Sensemaker / Hub-like instance with http + _rootKey
 * @param {Function} passwordCreateHandler Bound create_session middleware
 */
function mountFabricProtocolHttp (sensemaker, passwordCreateHandler) {
  if (!sensemaker || !sensemaker.http || typeof sensemaker.http._addRoute !== 'function') {
    throw new Error('mountFabricProtocolHttp: sensemaker.http._addRoute required');
  }
  if (typeof passwordCreateHandler !== 'function') {
    throw new Error('mountFabricProtocolHttp: passwordCreateHandler required');
  }

  if (!sensemaker._desktopAuthSessions) sensemaker._desktopAuthSessions = new Map();
  if (!sensemaker._deviceLinkSessions) sensemaker._deviceLinkSessions = new Map();
  if (!sensemaker._delegationRegistry) sensemaker._delegationRegistry = new Map();
  if (!sensemaker._delegationSignatureMessages) sensemaker._delegationSignatureMessages = new Map();

  // Desktop auth + device-link hub self-sign use `_rootKey`.
  if (!sensemaker._rootKey && sensemaker.key) sensemaker._rootKey = sensemaker.key;
  if (!sensemaker.key && sensemaker._rootKey) sensemaker.key = sensemaker._rootKey;

  sensemaker.http._addRoute('POST', '/sessions/:sessionId/signatures', (req, res) => {
    desktopAuth.handleDesktopSign(sensemaker, req, res);
  });
  sensemaker.http._addRoute('GET', '/sessions/:sessionId', (req, res) => {
    desktopAuth.handleSessionGet(sensemaker, req, res);
  });

  // Dual-mode create: Fabric origin challenge vs password/token (first Express match wins —
  // register only this handler for POST /sessions).
  sensemaker.http._addRoute('POST', '/sessions', (req, res, next) => {
    const body = (req && req.body && typeof req.body === 'object') ? req.body : {};
    if (isFabricDesktopSessionCreate(body)) {
      return desktopAuth.handleSessionCreate(sensemaker, req, res);
    }
    return passwordCreateHandler(req, res, next);
  });

  mountFabricDeviceLinkHttp(sensemaker);

  // Do not mount Hub GET /sessions (delegation token list) — Sensemaker owns password session list.
  mountFabricDelegationHttp(sensemaker, {
    mountSessionsList: false,
    mountSessionDestroy: true,
    mountAudit: true
  });

  return {
    desktopAuth: true,
    deviceLink: true,
    delegation: true
  };
}

module.exports = {
  isFabricDesktopSessionCreate,
  mountFabricProtocolHttp
};
