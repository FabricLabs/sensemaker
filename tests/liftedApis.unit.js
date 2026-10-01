'use strict';

/**
 * Sensemaker coverage for Hub-lifted Fabric APIs (package imports, not deep path.join).
 */
const assert = require('assert');
const path = require('path');
const Key = require('@fabric/core/types/key');
const {
  mountFabricProtocolHttp,
  isFabricDesktopSessionCreate
} = require('../functions/fabricProtocolMount');

describe('Sensemaker lifted Hub APIs', function () {
  it('imports Hub identity / delegation / allowlist via package exports', function () {
    const desktopAuth = require('@fabric/hub/functions/fabricDesktopAuth');
    const deviceLink = require('@fabric/hub/functions/fabricDeviceLink');
    const delegation = require('@fabric/hub/functions/fabricDelegation');
    const allowlist = require('@fabric/hub/functions/fabricHubAllowlist');
    const shared = require('@fabric/hub/functions/httpSharedMode');

    assert.strictEqual(typeof desktopAuth.handleSessionCreate, 'function');
    assert.strictEqual(typeof desktopAuth.handleDesktopSign, 'function');
    assert.strictEqual(typeof deviceLink.mountFabricDeviceLinkHttp, 'function');
    assert.strictEqual(typeof delegation.mountFabricDelegationHttp, 'function');
    assert.strictEqual(typeof delegation.getDelegationSessionById, 'function');
    assert.strictEqual(allowlist.isAllowedFabricHub('https://hub.fabric.pub'), true);
    assert.strictEqual(allowlist.isAllowedFabricHub('https://phish.example'), false);
    assert.strictEqual(shared.resolveHttpListenHost({ mode: 'relay', env: {} }), '127.0.0.1');
  });

  it('EmailService re-exports @fabric/hub/services/email', function () {
    const local = require('../services/email');
    const hub = require('@fabric/hub/services/email');
    assert.strictEqual(local, hub);
    const svc = new local({ host: '127.0.0.1', port: 1025 });
    assert.strictEqual(typeof svc.send, 'function');
    if (typeof svc.getTransportMode === 'function') {
      assert.strictEqual(svc.getTransportMode(), 'smtp');
    }
  });

  it('services/fabric extends Hub FabricService without path.join deep-require', function () {
    const FabricNetwork = require('../services/fabric');
    const HubFabric = require('@fabric/hub/services/fabric');
    assert.ok(FabricNetwork.prototype instanceof HubFabric);
    const src = require('fs').readFileSync(
      path.join(__dirname, '..', 'services', 'fabric.js'),
      'utf8'
    );
    assert.ok(src.includes("@fabric/hub/services/fabric"));
    assert.ok(!src.includes("path.join(hubRoot"));
  });

  it('imports Hub bulkSecurityAdvisory via package export', function () {
    const hub = require('@fabric/hub/functions/bulkSecurityAdvisory');
    assert.strictEqual(typeof hub.looksLikeBulkSecurityAdvisory, 'function');
    assert.strictEqual(hub.looksLikeBulkSecurityAdvisory({
      ghsa_id: 'GHSA-aaaa-bbbb-cccc',
      summary: 'Malicious code in @zalastax/nolb-example'
    }), true);
    assert.strictEqual(hub.looksLikeBulkSecurityAdvisory({ title: 'ordinary note' }), false);
  });

  it('hubLifecycle is available for future super.start migration', function () {
    const life = require('@fabric/hub/functions/hubLifecycle');
    assert.ok(Array.isArray(life.HUB_START_PHASES));
    assert.ok(life.HUB_START_PHASES.includes('routes'));
    assert.strictEqual(typeof life.runHubStartPhase, 'function');
  });
});

describe('Sensemaker fabricProtocolMount + lifted delegation', function () {
  function makeHub () {
    const routes = [];
    const rootKey = new Key();
    return {
      routes,
      _rootKey: rootKey,
      key: rootKey,
      http: {
        _addRoute (method, path, handler) {
          routes.push({ method, path, handler });
        }
      }
    };
  }

  function makeRes () {
    return {
      statusCode: 200,
      headers: {},
      status (n) { this.statusCode = n; return this; },
      setHeader (k, v) { this.headers[k] = v; return this; },
      json (body) { this.body = body; return this; },
      send (s) {
        if (typeof s === 'string') {
          try { this.body = JSON.parse(s); } catch (_) { this.body = s; }
        } else {
          this.body = s;
        }
        return this;
      },
      end () { return this; }
    };
  }

  it('isFabricDesktopSessionCreate gates password vs Fabric origin create', function () {
    assert.strictEqual(isFabricDesktopSessionCreate({ origin: 'http://127.0.0.1:3040' }), true);
    assert.strictEqual(isFabricDesktopSessionCreate({ username: 'a', password: 'b' }), false);
  });

  it('mounts delegation audit/destroy without GET /sessions list', function () {
    const hub = makeHub();
    const mounted = mountFabricProtocolHttp(hub, () => {});
    assert.deepStrictEqual(mounted, {
      desktopAuth: true,
      deviceLink: true,
      delegation: true
    });
    const paths = hub.routes.map((r) => `${r.method} ${r.path}`);
    assert.ok(paths.includes('GET /sessions/:sessionId/delegation/audit'));
    assert.ok(paths.includes('DELETE /sessions/:sessionId'));
    assert.ok(!paths.includes('GET /sessions'));
  });

  it('delegation destroy removes a registered token', function () {
    const hub = makeHub();
    mountFabricProtocolHttp(hub, () => {});
    const token = 'a'.repeat(48);
    hub._delegationRegistry.set(token, {
      origin: 'http://127.0.0.1:3040',
      linkedAt: Date.now(),
      identityId: 'id1'
    });

    const delRoute = hub.routes.find((r) => r.method === 'DELETE' && r.path === '/sessions/:sessionId');
    assert.ok(delRoute);
    const res = makeRes();
    delRoute.handler(
      {
        params: { sessionId: token },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' }
      },
      res
    );
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body && res.body.ok === true);
    assert.strictEqual(hub._delegationRegistry.has(token), false);
  });

  it('delegation audit requires bearer matching session token', function () {
    const hub = makeHub();
    mountFabricProtocolHttp(hub, () => {});
    const token = 'b'.repeat(48);
    hub._delegationRegistry.set(token, {
      origin: 'http://127.0.0.1:3040',
      linkedAt: Date.now(),
      identityId: 'id1'
    });

    const audit = hub.routes.find(
      (r) => r.method === 'GET' && r.path === '/sessions/:sessionId/delegation/audit'
    );
    assert.ok(audit);

    const denied = makeRes();
    audit.handler(
      {
        params: { sessionId: token },
        headers: {},
        socket: { remoteAddress: '127.0.0.1' }
      },
      denied
    );
    assert.ok(denied.statusCode === 401 || denied.statusCode === 403 || (denied.body && denied.body.ok === false));

    const okRes = makeRes();
    audit.handler(
      {
        params: { sessionId: token },
        headers: { authorization: `Bearer ${token}` },
        socket: { remoteAddress: '127.0.0.1' }
      },
      okRes
    );
    assert.strictEqual(okRes.statusCode, 200);
    assert.ok(okRes.body && okRes.body.ok === true);
  });

  it('desktop auth create still works alongside delegation mounts', function () {
    const hub = makeHub();
    mountFabricProtocolHttp(hub, () => {});
    const postSessions = hub.routes.find((r) => r.method === 'POST' && r.path === '/sessions');
    const res = makeRes();
    postSessions.handler(
      {
        body: { origin: 'http://127.0.0.1:3040' },
        headers: { origin: 'http://127.0.0.1:3040' },
        socket: { remoteAddress: '127.0.0.1' }
      },
      res,
      () => {}
    );
    assert.ok(res.body && res.body.ok === true);
    assert.ok(res.body.sessionId);
  });
});
