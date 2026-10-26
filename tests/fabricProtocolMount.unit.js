'use strict';

const assert = require('assert');
const Key = require('@fabric/core/types/key');
const passport = require('@fabric/core/functions/passport');
const {
  isPassportSessionCreate,
  sensemakerPinnedOrigins,
  mountFabricProtocolHttp
} = require('../functions/fabricProtocolMount');

const ORIGIN = 'http://127.0.0.1:3040';

function makeHub (settings = { http: { port: 3040 } }) {
  const routes = [];
  const rootKey = new Key();
  return {
    routes,
    settings,
    _rootKey: rootKey,
    key: rootKey,
    http: {
      _addRoute (method, path, handler) {
        routes.push({ method, path, handler });
      }
    }
  };
}

function find (hub, method, path) {
  const route = hub.routes.find((r) => r.method === method && r.path === path);
  assert.ok(route, `${method} ${path} mounted`);
  return route.handler;
}

// Response stub for passportHttp handlers (statusCode / setHeader / end) and
// Express-style password handlers (status / json); resolves when answered.
function call (handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader (k, v) { this.headers[k.toLowerCase()] = v; return this; },
      getHeader (k) { return this.headers[k.toLowerCase()]; },
      status (n) { this.statusCode = n; return this; },
      json (body) { this.body = body; resolve(this); return this; },
      end (payload) {
        if (payload != null) {
          try { this.body = JSON.parse(String(payload)); } catch (_) { this.body = String(payload); }
        }
        resolve(this);
        return this;
      }
    };
    const full = Object.assign({ headers: {}, socket: { remoteAddress: '127.0.0.1' } }, req);
    Promise.resolve(handler(full, res, () => res.end())).catch(reject);
  });
}

function cookieValue (res, name) {
  const all = [].concat(res.headers['set-cookie'] || []);
  const line = all.find((c) => c.startsWith(`${name}=`));
  return line ? line.split(';')[0] : null;
}

describe('fabricProtocolMount', function () {
  describe('isPassportSessionCreate', function () {
    it('accepts a signed assertion body', function () {
      assert.strictEqual(isPassportSessionCreate({ assertion: 'fabric:abcd' }), true);
    });

    it('rejects password / token login bodies and v1 origin-only bodies', function () {
      assert.strictEqual(isPassportSessionCreate({ assertion: 'fabric:abcd', username: 'alice', password: 'x' }), false);
      assert.strictEqual(isPassportSessionCreate({ token: 'abc' }), false);
      assert.strictEqual(isPassportSessionCreate({ username: 'a', password: 'b' }), false);
      assert.strictEqual(isPassportSessionCreate({ origin: ORIGIN }), false);
      assert.strictEqual(isPassportSessionCreate({ assertion: 'not-a-frame' }), false);
      assert.strictEqual(isPassportSessionCreate(null), false);
    });
  });

  describe('sensemakerPinnedOrigins', function () {
    it('pins baseUrl, the domain, and loopback on the HTTP port', function () {
      const pins = sensemakerPinnedOrigins({ baseUrl: 'https://sensemaker.io/app/', domain: 'sensemaker.io', http: { port: 4000 } });
      assert.deepStrictEqual(pins, ['https://sensemaker.io', 'http://127.0.0.1:4000', 'http://localhost:4000', 'http://[::1]:4000']);
    });

    it('ignores a missing or malformed domain', function () {
      const pins = sensemakerPinnedOrigins({ domain: 'evil.test/path?', http: { port: 3040 } });
      assert.ok(!pins.some((o) => o.includes('evil')));
      assert.ok(pins.includes(ORIGIN));
    });
  });

  describe('mountFabricProtocolHttp', function () {
    it('registers Passport challenge + dual-mode sessions + device-link routes, and no delegation', function () {
      const hub = makeHub();
      const mounted = mountFabricProtocolHttp(hub, () => {}, { current: () => {}, destroy: () => {} });
      assert.deepStrictEqual(mounted, { passport: true, deviceLink: true });

      const paths = hub.routes.map((r) => `${r.method} ${r.path}`);
      for (const p of ['POST /sessions/challenges', 'POST /sessions', 'GET /sessions/current', 'DELETE /sessions/current',
        'POST /device-links', 'GET /device-links/:sessionId', 'POST /device-links/:sessionId/signatures']) {
        assert.ok(paths.includes(p), p);
      }
      assert.strictEqual(paths.filter((p) => p === 'POST /sessions').length, 1, 'one POST /sessions handler');
      for (const p of ['GET /sessions', 'GET /sessions/:sessionId', 'POST /sessions/:sessionId/signatures', 'DELETE /sessions/:sessionId', 'POST /sessions/self']) {
        assert.ok(!paths.includes(p), `no ${p}`);
      }
      assert.ok(!paths.some((p) => p.includes('delegation')));
      assert.ok(hub._deviceLinkSessions instanceof Map);
      assert.deepStrictEqual(hub._passport.relyingParty.pinnedOrigins, sensemakerPinnedOrigins(hub.settings));
    });

    it('sends password bodies to the password handler', async function () {
      const hub = makeHub();
      let passwordCalls = 0;
      mountFabricProtocolHttp(hub, (req, res) => {
        passwordCalls += 1;
        res.status(200).json({ mode: 'password' });
      });
      const res = await call(find(hub, 'POST', '/sessions'), { body: { username: 'alice', password: 'secret' } });
      assert.strictEqual(passwordCalls, 1);
      assert.strictEqual(res.body.mode, 'password');
    });

    it('signs in with Passport on a pinned origin, and answers /sessions/current for that session', async function () {
      const hub = makeHub();
      let passwordCalls = 0;
      let currentCalls = 0;
      mountFabricProtocolHttp(hub, () => { passwordCalls += 1; }, {
        current: (req, res) => { currentCalls += 1; res.status(401).json({ message: 'Invalid session.' }); },
        destroy: (req, res) => res.status(200).json({ password: true })
      });

      const challenge = await call(find(hub, 'POST', '/sessions/challenges'), { headers: { origin: ORIGIN }, body: {} });
      assert.strictEqual(challenge.statusCode, 200, JSON.stringify(challenge.body));
      const binding = cookieValue(challenge, 'fabric.passport');
      assert.ok(binding, 'binding secret set as a cookie');
      const read = passport.readChallenge(challenge.body.challenge);
      assert.ok(read.ok, read.error);
      assert.strictEqual(read.challenge.origin, ORIGIN);

      const signer = new Key();
      const signed = passport.signAssertion({ origin: ORIGIN, challenge: challenge.body.challenge, signer: 'passport', network: 'mainnet' }, signer);
      const session = await call(find(hub, 'POST', '/sessions'), {
        headers: { origin: ORIGIN, cookie: binding },
        body: { assertion: signed.uri }
      });
      assert.strictEqual(session.statusCode, 200, JSON.stringify(session.body));
      assert.strictEqual(passwordCalls, 0, 'password handler must not run for an assertion');
      const sessionCookie = cookieValue(session, 'fabric.session');
      assert.ok(sessionCookie);

      const replay = await call(find(hub, 'POST', '/sessions'), {
        headers: { origin: ORIGIN, cookie: binding },
        body: { assertion: signed.uri }
      });
      assert.notStrictEqual(replay.statusCode, 200, 'a challenge signs in once');

      const current = await call(find(hub, 'GET', '/sessions/current'), { headers: { cookie: sessionCookie } });
      assert.strictEqual(current.statusCode, 200, JSON.stringify(current.body));
      assert.ok(current.body.session);
      assert.strictEqual(currentCalls, 0);

      const anonymous = await call(find(hub, 'GET', '/sessions/current'), {});
      assert.strictEqual(anonymous.statusCode, 401);
      assert.strictEqual(currentCalls, 1, 'no Passport session: the password session answers');

      const ended = await call(find(hub, 'DELETE', '/sessions/current'), { headers: { cookie: sessionCookie } });
      assert.strictEqual(ended.statusCode, 200);
      const after = await call(find(hub, 'GET', '/sessions/current'), { headers: { cookie: sessionCookie } });
      assert.strictEqual(after.statusCode, 401);
    });

    it('refuses a challenge for an origin that is not pinned', async function () {
      const hub = makeHub();
      mountFabricProtocolHttp(hub, () => {});
      const res = await call(find(hub, 'POST', '/sessions/challenges'), { headers: { origin: 'https://evil.test' }, body: {} });
      assert.strictEqual(res.statusCode, 403);
    });
  });
});
