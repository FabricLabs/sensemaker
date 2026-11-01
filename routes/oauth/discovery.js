/**
 * @api {get} /.well-known/openid-configuration Provider Metadata
 * @apiName OAuthDiscovery
 * @apiGroup OAuth
 * @apiDescription OpenID Connect Discovery and RFC 8414 metadata (also served at
 * `/.well-known/oauth-authorization-server`).
 * @apiVersion 1.0.0
 */
'use strict';

const { allowCors, ensureProvider } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  allowCors(res);
  if (!ensureProvider(this, res)) return;
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(this.oauth.discovery(this.oauth.issuerFor(req)));
};
