/**
 * @api {post} /oauth/token Token Endpoint
 * @apiName OAuthToken
 * @apiGroup OAuth
 * @apiDescription Exchange an authorization code, a refresh token, or client credentials for tokens.
 * Confidential Applications authenticate with `client_assertion_type=urn:fabric:params:oauth:client-assertion-type:bip340`
 * and a `client_assertion` signed by their registered Fabric key; public Applications send `client_id` only.
 * @apiVersion 1.0.0
 * @apiParam {String="authorization_code","refresh_token","client_credentials"} grant_type
 * @apiParam {String} [code]
 * @apiParam {String} [code_verifier]
 * @apiParam {String} [redirect_uri]
 * @apiParam {String} [refresh_token]
 * @apiParam {String} [scope]
 * @apiParam {String} [client_id]
 * @apiParam {String} [client_assertion_type]
 * @apiParam {String} [client_assertion]
 */
'use strict';

const { allowCors, ensureProvider, noStore, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  allowCors(res);
  noStore(res);
  if (!ensureProvider(this, res)) return;
  try {
    if (!await this.oauth.rateLimit(`token:${req.ip}`)) {
      res.set('Retry-After', '60');
      return res.status(429).json({ error: 'temporarily_unavailable', error_description: 'Too many token requests; try again in a minute.' });
    }
    const result = await this.oauth.token(req.body || {}, { issuer: this.oauth.issuerFor(req) });
    res.json(result);
  } catch (err) {
    sendOAuthError(res, err);
  }
};
