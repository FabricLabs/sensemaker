/**
 * @api {get} /oauth/jwks JSON Web Key Set
 * @apiName OAuthJwks
 * @apiGroup OAuth
 * @apiDescription The node's secp256k1 key as an `ES256K` JWK, for verifying ID tokens.
 * @apiVersion 1.0.0
 */
'use strict';

const { allowCors, ensureProvider } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  allowCors(res);
  if (!ensureProvider(this, res)) return;
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(this.oauth.jwks());
};
