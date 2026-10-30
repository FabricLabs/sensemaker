'use strict';

const assert = require('assert');
const crypto = require('crypto');
const Key = require('@fabric/core/types/key');
const { OAuthProvider, isAllowedRedirectUri } = require('../../services/oauth');
const { buildClientAssertion } = require('../../functions/fabricClientAssertion');
const { nodeJwk, verifyIdToken } = require('../../services/oauthToken');
const requireScope = require('../../functions/requireScope');

const ISSUER = 'https://sensemaker.test';
const TOKEN_ENDPOINT = `${ISSUER}/oauth/token`;

function memoryRedis () {
  const map = new Map();
  return {
    map,
    async set (key, value, opts = {}) {
      if (opts.NX && map.has(key)) return null;
      map.set(key, String(value));
      return 'OK';
    },
    async get (key) {
      return map.has(key) ? map.get(key) : null;
    },
    async del (key) {
      return map.delete(key) ? 1 : 0;
    },
    async incr (key) {
      const next = Number(map.get(key) || 0) + 1;
      map.set(key, String(next));
      return next;
    },
    async expire () {
      return 1;
    }
  };
}

function memoryStore () {
  const applications = [];
  const authorizations = [];
  const tokens = [];
  const users = [{ id: 1, username: 'alice', display_name: 'Alice', email: 'alice@example.com' }];
  return {
    applications,
    tokens,
    async findApplication (id) {
      return applications.find((a) => a.id === id) || null;
    },
    async findApplicationByClientId (clientId) {
      return applications.find((a) => a.client_id === clientId) || null;
    },
    async listApplications (filter = {}) {
      return applications.filter((a) => filter.ownerId == null || a.owner_id === filter.ownerId);
    },
    async insertApplication (fields) {
      const row = Object.assign({ id: applications.length + 1 }, fields);
      applications.push(row);
      return row;
    },
    async updateApplication (id, fields) {
      const row = applications.find((a) => a.id === id);
      Object.assign(row, fields);
      return row;
    },
    async findAuthorization (userId, applicationId) {
      return authorizations.find((a) => a.user_id === userId && a.application_id === applicationId && !a.revoked_at) || null;
    },
    async saveAuthorization (userId, applicationId, scopes) {
      const existing = await this.findAuthorization(userId, applicationId);
      if (existing) existing.scopes = scopes;
      else authorizations.push({ user_id: userId, application_id: applicationId, scopes, created_at: new Date() });
      return this.findAuthorization(userId, applicationId);
    },
    async listAuthorizations (userId) {
      return authorizations.filter((a) => a.user_id === userId && !a.revoked_at);
    },
    async revokeAuthorization (userId, applicationId) {
      authorizations.filter((a) => a.user_id === userId && a.application_id === applicationId).forEach((a) => { a.revoked_at = new Date(); });
    },
    async insertRefreshToken (fields) {
      tokens.push(Object.assign({ revoked_at: null, replaced_by: null }, fields));
    },
    async findRefreshToken (tokenHash) {
      return tokens.find((t) => t.token_hash === tokenHash) || null;
    },
    async markRefreshTokenReplaced (tokenHash, replacedBy) {
      const row = tokens.find((t) => t.token_hash === tokenHash);
      row.replaced_by = replacedBy;
      row.revoked_at = new Date();
    },
    async revokeRefreshTokens (filter) {
      tokens.filter((t) => t.application_id === filter.applicationId && !t.revoked_at &&
        (filter.userId === undefined || t.user_id === filter.userId)).forEach((t) => { t.revoked_at = new Date(); });
    },
    async findUser (id) {
      return users.find((u) => u.id === id) || null;
    }
  };
}

function pkcePair () {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

async function rejects (promise, error) {
  await assert.rejects(promise, (err) => {
    assert.strictEqual(err.error, error, `expected ${error}, got ${err.error}: ${err.message}`);
    return true;
  });
}

describe('oauth provider', function () {
  let provider;
  let store;
  let redis;
  const nodeKey = new Key();
  const appKey = new Key();

  function assertion (clientId, audience = TOKEN_ENDPOINT) {
    return {
      client_assertion_type: 'urn:fabric:params:oauth:client-assertion-type:bip340',
      client_assertion: buildClientAssertion(appKey, { clientId, audience })
    };
  }

  async function authorize (application, options = {}) {
    const { verifier, challenge } = pkcePair();
    const request = await provider.validateAuthorizeRequest({
      response_type: 'code',
      client_id: application.client_id,
      redirect_uri: 'https://bot.example/callback',
      scope: options.scope || 'openid profile documents:read',
      state: 'xyz',
      nonce: 'nonce-1',
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });
    const consent = await provider.createConsent(1, request);
    const approved = await provider.takeConsent(1, consent);
    const redirect = new URL(await provider.approve(1, approved, ISSUER));
    return { code: redirect.searchParams.get('code'), redirect, verifier };
  }

  beforeEach(async function () {
    store = memoryStore();
    redis = memoryRedis();
    provider = new OAuthProvider({ key: nodeKey, store, redis, settings: { issuer: ISSUER } });
  });

  async function confidentialApp (overrides = {}) {
    return provider.createApplication(1, Object.assign({
      name: 'G00N Bot',
      type: 'confidential',
      pubkey: appKey.pubkey,
      redirect_uris: ['https://bot.example/callback'],
      grant_types: ['authorization_code', 'refresh_token', 'client_credentials'],
      scopes: ['openid', 'profile', 'documents:read', 'completions']
    }, overrides));
  }

  it('validates redirect URIs', function () {
    assert.strictEqual(isAllowedRedirectUri('https://example.com/cb'), true);
    assert.strictEqual(isAllowedRedirectUri('http://127.0.0.1:8080/cb'), true);
    assert.strictEqual(isAllowedRedirectUri('fabric:login'), true);
    assert.strictEqual(isAllowedRedirectUri('http://example.com/cb'), false);
    assert.strictEqual(isAllowedRedirectUri('javascript:alert(1)'), false);
    assert.strictEqual(isAllowedRedirectUri('https://example.com/cb#frag'), false);
  });

  it('requires a Fabric key for confidential applications', async function () {
    await rejects(provider.createApplication(1, { name: 'No key', redirect_uris: ['https://x.example/cb'] }), 'invalid_client_metadata');
  });

  it('refuses client_credentials for public applications', async function () {
    await rejects(provider.createApplication(1, {
      name: 'SPA',
      type: 'public',
      redirect_uris: ['https://spa.example/cb'],
      grant_types: ['authorization_code', 'client_credentials']
    }), 'invalid_client_metadata');
  });

  it('runs authorization code + PKCE through to tokens and an ID token', async function () {
    const application = await confidentialApp();
    const { code, redirect, verifier } = await authorize(application);
    assert.strictEqual(redirect.searchParams.get('state'), 'xyz');
    assert.strictEqual(redirect.searchParams.get('iss'), ISSUER);

    const result = await provider.token(Object.assign({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      redirect_uri: 'https://bot.example/callback'
    }, assertion(application.client_id)), { issuer: ISSUER });

    assert.strictEqual(result.token_type, 'Bearer');
    assert.ok(result.refresh_token);
    assert.strictEqual(result.scope, 'openid profile documents:read');

    const claims = verifyIdToken(result.id_token, nodeJwk(nodeKey));
    assert.strictEqual(claims.sub, '1');
    assert.strictEqual(claims.aud, application.client_id);
    assert.strictEqual(claims.nonce, 'nonce-1');
    assert.strictEqual(claims.preferred_username, 'alice');

    const access = await provider.verifyBearer(result.access_token);
    assert.strictEqual(access.userId, 1);
    assert.deepStrictEqual(access.scopes.sort(), ['documents:read', 'openid', 'profile']);

    const info = await provider.userinfo(access);
    assert.strictEqual(info.sub, '1');
    assert.strictEqual(info.name, 'Alice');
    assert.strictEqual(info.email, undefined);
  });

  it('rejects a reused authorization code', async function () {
    const application = await confidentialApp();
    const { code, verifier } = await authorize(application);
    const body = { grant_type: 'authorization_code', code, code_verifier: verifier };
    await provider.token(Object.assign({}, body, assertion(application.client_id)), { issuer: ISSUER });
    await rejects(provider.token(Object.assign({}, body, assertion(application.client_id)), { issuer: ISSUER }), 'invalid_grant');
  });

  it('rejects a wrong PKCE verifier', async function () {
    const application = await confidentialApp();
    const { code } = await authorize(application);
    await rejects(provider.token(Object.assign({
      grant_type: 'authorization_code',
      code,
      code_verifier: pkcePair().verifier
    }, assertion(application.client_id)), { issuer: ISSUER }), 'invalid_grant');
  });

  it('requires PKCE on every authorization request', async function () {
    const application = await confidentialApp();
    await rejects(provider.validateAuthorizeRequest({
      response_type: 'code',
      client_id: application.client_id,
      redirect_uri: 'https://bot.example/callback'
    }), 'invalid_request');
  });

  it('rejects an unregistered redirect URI without redirecting', async function () {
    const application = await confidentialApp();
    await assert.rejects(provider.validateAuthorizeRequest({
      response_type: 'code',
      client_id: application.client_id,
      redirect_uri: 'https://evil.example/callback',
      code_challenge: pkcePair().challenge,
      code_challenge_method: 'S256'
    }), (err) => err.error === 'invalid_request' && !err.redirectUri);
  });

  it('binds consent to the user who saw it', async function () {
    const application = await confidentialApp();
    const request = await provider.validateAuthorizeRequest({
      response_type: 'code',
      client_id: application.client_id,
      code_challenge: pkcePair().challenge,
      code_challenge_method: 'S256'
    });
    const consent = await provider.createConsent(1, request);
    await rejects(provider.takeConsent(2, consent), 'invalid_request');
  });

  it('rotates refresh tokens and revokes the grant when an old one comes back', async function () {
    const application = await confidentialApp();
    const { code, verifier } = await authorize(application);
    const first = await provider.token(Object.assign({ grant_type: 'authorization_code', code, code_verifier: verifier }, assertion(application.client_id)), { issuer: ISSUER });

    const second = await provider.token(Object.assign({ grant_type: 'refresh_token', refresh_token: first.refresh_token }, assertion(application.client_id)), { issuer: ISSUER });
    assert.notStrictEqual(second.refresh_token, first.refresh_token);
    assert.strictEqual(second.id_token, undefined);

    await rejects(provider.token(Object.assign({ grant_type: 'refresh_token', refresh_token: first.refresh_token }, assertion(application.client_id)), { issuer: ISSUER }), 'invalid_grant');
    await rejects(provider.token(Object.assign({ grant_type: 'refresh_token', refresh_token: second.refresh_token }, assertion(application.client_id)), { issuer: ISSUER }), 'invalid_grant');
  });

  it('issues client credentials tokens that act as the owner without user scopes', async function () {
    const application = await confidentialApp();
    const result = await provider.token(Object.assign({ grant_type: 'client_credentials' }, assertion(application.client_id)), { issuer: ISSUER });
    assert.strictEqual(result.refresh_token, undefined);
    assert.strictEqual(result.id_token, undefined);
    assert.strictEqual(result.scope, 'documents:read completions');

    const access = await provider.verifyBearer(result.access_token);
    assert.strictEqual(access.sub, `app:${application.client_id}`);
    assert.strictEqual(access.userId, null);
    assert.strictEqual(access.actingUserId, 1);
  });

  it('refuses client credentials without a client assertion', async function () {
    const application = await confidentialApp();
    await rejects(provider.token({ grant_type: 'client_credentials', client_id: application.client_id }, { issuer: ISSUER }), 'invalid_client');
  });

  it('refuses a replayed client assertion', async function () {
    const application = await confidentialApp();
    const auth = assertion(application.client_id);
    await provider.token(Object.assign({ grant_type: 'client_credentials' }, auth), { issuer: ISSUER });
    await rejects(provider.token(Object.assign({ grant_type: 'client_credentials' }, auth), { issuer: ISSUER }), 'invalid_client');
  });

  it('lets public applications use PKCE without a client assertion', async function () {
    const application = await provider.createApplication(1, {
      name: 'SPA',
      type: 'public',
      redirect_uris: ['https://bot.example/callback'],
      scopes: ['openid']
    });
    const { code, verifier } = await authorize(application, { scope: 'openid' });
    const result = await provider.token({ grant_type: 'authorization_code', client_id: application.client_id, code, code_verifier: verifier }, { issuer: ISSUER });
    assert.ok(result.access_token);
    await rejects(provider.token({ grant_type: 'client_credentials', client_id: application.client_id }, { issuer: ISSUER }), 'invalid_client');
  });

  it('stops honoring access tokens when the user revokes the application', async function () {
    const application = await confidentialApp();
    const { code, verifier } = await authorize(application);
    const result = await provider.token(Object.assign({ grant_type: 'authorization_code', code, code_verifier: verifier }, assertion(application.client_id)), { issuer: ISSUER });
    assert.ok(await provider.verifyBearer(result.access_token));
    await provider.revokeUserAuthorization(1, application);
    assert.strictEqual(await provider.verifyBearer(result.access_token), null);
    await rejects(provider.token(Object.assign({ grant_type: 'refresh_token', refresh_token: result.refresh_token }, assertion(application.client_id)), { issuer: ISSUER }), 'invalid_grant');
  });

  it('stops honoring tokens once the application is disabled', async function () {
    const application = await confidentialApp();
    const result = await provider.token(Object.assign({ grant_type: 'client_credentials' }, assertion(application.client_id)), { issuer: ISSUER });
    await provider.disableApplication(application);
    assert.strictEqual(await provider.verifyBearer(result.access_token), null);
  });

  it('introspects only tokens issued to the calling application', async function () {
    const application = await confidentialApp();
    const result = await provider.token(Object.assign({ grant_type: 'client_credentials' }, assertion(application.client_id)), { issuer: ISSUER });
    const own = await provider.introspect(Object.assign({ token: result.access_token }, assertion(application.client_id, `${ISSUER}/oauth/introspect`)), { issuer: ISSUER });
    assert.strictEqual(own.active, true);
    assert.strictEqual(own.client_id, application.client_id);

    const other = await provider.createApplication(1, { name: 'Other', pubkey: appKey.pubkey, redirect_uris: [], grant_types: ['client_credentials'], scopes: ['completions'] });
    const foreign = await provider.introspect(Object.assign({ token: result.access_token }, assertion(other.client_id, `${ISSUER}/oauth/introspect`)), { issuer: ISSUER });
    assert.strictEqual(foreign.active, false);
  });

  it('revokes an access token on request', async function () {
    const application = await confidentialApp();
    const result = await provider.token(Object.assign({ grant_type: 'client_credentials' }, assertion(application.client_id)), { issuer: ISSUER });
    await provider.revoke(Object.assign({ token: result.access_token, token_type_hint: 'access_token' }, assertion(application.client_id, `${ISSUER}/oauth/revoke`)), { issuer: ISSUER });
    assert.strictEqual(await provider.verifyBearer(result.access_token), null);
  });

  it('publishes discovery metadata', function () {
    const metadata = provider.discovery(ISSUER);
    assert.strictEqual(metadata.token_endpoint, TOKEN_ENDPOINT);
    assert.deepStrictEqual(metadata.code_challenge_methods_supported, ['S256']);
    assert.deepStrictEqual(provider.jwks().keys[0], nodeJwk(nodeKey));
  });

  describe('requireScope', function () {
    function response () {
      return {
        statusCode: 200,
        headers: {},
        body: null,
        set (name, value) { this.headers[name] = value; return this; },
        status (code) { this.statusCode = code; return this; },
        json (body) { this.body = body; return this; }
      };
    }

    it('signs the OAuth caller in only when every scope is present', function () {
      let seen = null;
      const handler = requireScope(['documents:read'], (req) => { seen = req.user; });
      const req = { user: { id: null }, oauth: { clientId: 'c', scopes: ['documents:read'], actingUserId: 1 } };
      handler(req, response());
      assert.strictEqual(seen.id, 1);
      assert.strictEqual(seen.sessionTrust, 'oauth');
      assert.strictEqual(seen.is_admin, false);
    });

    it('answers 403 when a scope is missing', function () {
      let called = false;
      const handler = requireScope(['completions'], () => { called = true; });
      const res = response();
      handler({ user: { id: null }, oauth: { clientId: 'c', scopes: ['openid'], actingUserId: 1 } }, res);
      assert.strictEqual(called, false);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.error, 'insufficient_scope');
    });

    it('leaves signed-in sessions alone', function () {
      let seen = null;
      const handler = requireScope(['completions'], (req) => { seen = req.user; });
      handler({ user: { id: 5, sessionTrust: 'node-signed' }, oauth: null }, response());
      assert.strictEqual(seen.id, 5);
    });
  });
});
