'use strict';

const assert = require('assert');
const Key = require('@fabric/core/types/key');
const Identity = require('@fabric/core/types/identity');
const {
  isFabricDesktopSessionCreate,
  mountFabricProtocolHttp
} = require('../functions/fabricProtocolMount');

describe('fabricProtocolMount', function () {
  describe('isFabricDesktopSessionCreate', function () {
    it('accepts Hub-style origin-only bodies', function () {
      assert.strictEqual(
        isFabricDesktopSessionCreate({ origin: 'http://127.0.0.1:3040' }),
        true
      );
    });

    it('rejects password / token login bodies', function () {
      assert.strictEqual(
        isFabricDesktopSessionCreate({
          origin: 'http://127.0.0.1:3040',
          username: 'alice',
          password: 'x'
        }),
        false
      );
      assert.strictEqual(
        isFabricDesktopSessionCreate({ token: 'abc', origin: 'http://127.0.0.1:3040' }),
        false
      );
      assert.strictEqual(isFabricDesktopSessionCreate({ username: 'a', password: 'b' }), false);
    });

    it('rejects empty / missing origin', function () {
      assert.strictEqual(isFabricDesktopSessionCreate({}), false);
      assert.strictEqual(isFabricDesktopSessionCreate({ origin: '   ' }), false);
      assert.strictEqual(isFabricDesktopSessionCreate(null), false);
    });
  });

  describe('mountFabricProtocolHttp', function () {
    it('registers dual-mode sessions + device-link routes', function () {
      const routes = [];
      const rootKey = new Key();
      const hub = {
        _rootKey: rootKey,
        key: rootKey,
        http: {
          _addRoute (method, path, handler) {
            routes.push({ method, path, handler });
          }
        }
      };
      let passwordCalls = 0;
      const passwordHandler = (req, res) => {
        passwordCalls += 1;
        res.statusCode = 200;
        res.end('password');
      };

      const mounted = mountFabricProtocolHttp(hub, passwordHandler);
      assert.deepStrictEqual(mounted, { desktopAuth: true, deviceLink: true, delegation: true });

      const paths = routes.map((r) => `${r.method} ${r.path}`);
      assert.ok(paths.includes('POST /sessions'));
      assert.ok(paths.includes('GET /sessions/:sessionId'));
      assert.ok(paths.includes('POST /sessions/:sessionId/signatures'));
      assert.ok(paths.includes('POST /device-links'));
      assert.ok(paths.includes('GET /device-links/:sessionId'));
      assert.ok(paths.includes('POST /device-links/:sessionId/signatures'));
      assert.ok(paths.includes('GET /sessions/:sessionId/delegation/audit'));
      assert.ok(paths.includes('DELETE /sessions/:sessionId'));
      assert.ok(!paths.includes('GET /sessions'), 'must not clobber Sensemaker password session list');
      assert.ok(hub._desktopAuthSessions instanceof Map);
      assert.ok(hub._deviceLinkSessions instanceof Map);
      assert.ok(hub._delegationRegistry instanceof Map);
    });

    it('POST /sessions dispatches origin create vs password create', function (done) {
      const routes = [];
      const rootKey = new Key();
      const hub = {
        _rootKey: rootKey,
        key: rootKey,
        http: {
          _addRoute (method, path, handler) {
            routes.push({ method, path, handler });
          }
        }
      };

      let passwordCalls = 0;
      mountFabricProtocolHttp(hub, (req, res) => {
        passwordCalls += 1;
        res.status(200).json({ mode: 'password' });
      });

      const postSessions = routes.find((r) => r.method === 'POST' && r.path === '/sessions');
      assert.ok(postSessions);

      function makeRes () {
        return {
          statusCode: 200,
          status (n) { this.statusCode = n; return this; },
          json (body) { this.body = body; return this; },
          setHeader () { return this; },
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

      // Password path
      const resPw = makeRes();
      postSessions.handler(
        {
          body: { username: 'alice', password: 'secret' },
          headers: {},
          socket: { remoteAddress: '127.0.0.1' }
        },
        resPw,
        () => {}
      );
      assert.strictEqual(passwordCalls, 1);
      assert.strictEqual(resPw.body.mode, 'password');

      // Fabric desktop create path
      const resFab = makeRes();
      postSessions.handler(
        {
          body: { origin: 'http://127.0.0.1:3040' },
          headers: { origin: 'http://127.0.0.1:3040' },
          socket: { remoteAddress: '127.0.0.1' }
        },
        resFab,
        () => {}
      );

      assert.strictEqual(passwordCalls, 1, 'password handler must not run for origin create');
      assert.ok(resFab.body && resFab.body.ok === true, 'expected fabric session create ok');
      assert.ok(resFab.body.sessionId);
      assert.ok(String(resFab.body.protocolUrl || '').startsWith('fabric://login?'));
      assert.strictEqual(resFab.body.acceptsClientSignature, true);
      done();
    });

    it('completes client-signed login against mounted signatures route', function () {
      const {
        buildFabricIdentitySignedPayload
      } = require('@fabric/http/functions/fabricIdentitySchnorr');
      const routes = [];
      const hubKey = new Key();
      const clientKey = new Key();
      const clientIdent = new Identity(clientKey);
      const hub = {
        _rootKey: hubKey,
        key: hubKey,
        http: {
          _addRoute (method, path, handler) {
            routes.push({ method, path, handler });
          }
        }
      };
      mountFabricProtocolHttp(hub, () => {});

      const postSessions = routes.find((r) => r.method === 'POST' && r.path === '/sessions');
      const postSign = routes.find((r) => r.method === 'POST' && r.path === '/sessions/:sessionId/signatures');

      function makeRes () {
        return {
          statusCode: 200,
          status (n) { this.statusCode = n; return this; },
          json (body) { this.body = body; return this; },
          setHeader () { return this; },
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

      const createRes = makeRes();
      postSessions.handler(
        {
          body: { origin: 'http://127.0.0.1:3040' },
          headers: { origin: 'http://127.0.0.1:3040' },
          socket: { remoteAddress: '127.0.0.1' }
        },
        createRes,
        () => {}
      );
      assert.ok(createRes.body && createRes.body.sessionId);
      const { sessionId, message } = createRes.body;
      // Sign with Fabric-path key + matching identity.id / xpub (not master leaf).
      const signed = buildFabricIdentitySignedPayload(clientIdent, message);

      const signRes = makeRes();
      postSign.handler(
        {
          params: { sessionId },
          body: signed,
          headers: { origin: 'http://127.0.0.1:3040' },
          socket: { remoteAddress: '127.0.0.1' }
        },
        signRes,
        () => {}
      );
      assert.strictEqual(signRes.body && signRes.body.ok, true, signRes.body && signRes.body.error);
      assert.strictEqual(signRes.body.signer, 'client');
    });
  });
});
