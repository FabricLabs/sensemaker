'use strict';

const assert = require('assert');
const Key = require('@fabric/core/types/key');
const nodeSessionToken = require('../../services/nodeSessionToken');
const {
  issueAccessToken,
  issueIdToken,
  nodeJwk,
  verifyAccessToken,
  verifyIdToken,
  verifyPkce
} = require('../../services/oauthToken');

describe('oauth tokens', function () {
  const key = new Key();

  it('issues and verifies a scoped access token', function () {
    const { token } = issueAccessToken(key, { subject: 7, clientId: 'client-1', scope: 'openid documents:read' });
    const parsed = verifyAccessToken(token, key);
    assert.strictEqual(parsed.sub, '7');
    assert.strictEqual(parsed.clientId, 'client-1');
    assert.deepStrictEqual(parsed.scopes, ['documents:read', 'openid']);
  });

  it('drops unknown scopes', function () {
    const { token } = issueAccessToken(key, { subject: 7, clientId: 'client-1', scope: 'openid admin' });
    assert.deepStrictEqual(verifyAccessToken(token, key).scopes, ['openid']);
  });

  it('keeps access tokens and session tokens apart', function () {
    const { token } = issueAccessToken(key, { subject: 7, clientId: 'client-1', scope: 'openid' });
    assert.strictEqual(nodeSessionToken.verifyNodeSessionToken(token, key), null);
    const session = nodeSessionToken.issueNodeSessionToken(key, { subject: 7, isAdmin: true });
    assert.strictEqual(verifyAccessToken(session, key), null);
  });

  it('never carries session capabilities', function () {
    const { payload } = issueAccessToken(key, { subject: 7, clientId: 'client-1', scope: 'openid' });
    assert.strictEqual(payload.caps, undefined);
    assert.strictEqual(payload.roles, undefined);
  });

  it('rejects a token from another node', function () {
    const { token } = issueAccessToken(new Key(), { subject: 7, clientId: 'client-1', scope: 'openid' });
    assert.strictEqual(verifyAccessToken(token, key), null);
  });

  it('rejects an expired token', function () {
    const { token } = issueAccessToken(key, { subject: 7, clientId: 'client-1', scope: 'openid', expiresInSeconds: -1 });
    assert.strictEqual(verifyAccessToken(token, key), null);
  });

  it('signs ID tokens that verify against the published JWK', function () {
    const jwk = nodeJwk(key);
    assert.strictEqual(jwk.crv, 'secp256k1');
    assert.strictEqual(jwk.alg, 'ES256K');
    const jwt = issueIdToken(key, { issuer: 'https://sensemaker.test', subject: '7', audience: 'client-1', nonce: 'n-1' });
    const claims = verifyIdToken(jwt, jwk);
    assert.strictEqual(claims.sub, '7');
    assert.strictEqual(claims.aud, 'client-1');
    assert.strictEqual(claims.nonce, 'n-1');
    assert.strictEqual(verifyIdToken(jwt, nodeJwk(new Key())), null);
  });

  it('checks PKCE S256', function () {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    assert.strictEqual(verifyPkce(verifier, challenge), true);
    assert.strictEqual(verifyPkce(verifier + 'x', challenge), false);
    assert.strictEqual(verifyPkce('short', challenge), false);
  });
});
