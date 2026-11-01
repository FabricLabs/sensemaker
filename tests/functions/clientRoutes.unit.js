'use strict';

const assert = require('assert');
const { isClientRoute } = require('../../functions/clientRoutes');

describe('client routes', function () {
  it('serves the SPA for Applications and the consent screen', function () {
    assert.strictEqual(isClientRoute('/applications'), true);
    assert.strictEqual(isClientRoute('/applications/authorized'), true);
    assert.strictEqual(isClientRoute('/applications/42'), true);
    assert.strictEqual(isClientRoute('/oauth/authorize'), true);
  });

  it('leaves OAuth API endpoints to their handlers', function () {
    assert.strictEqual(isClientRoute('/oauth/token'), false);
    assert.strictEqual(isClientRoute('/oauth/jwks'), false);
    assert.strictEqual(isClientRoute('/.well-known/openid-configuration'), false);
  });
});
