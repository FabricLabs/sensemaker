/**
 * @api {get} /oauth/authorize Authorization Request
 * @apiName OAuthAuthorize
 * @apiGroup OAuth
 * @apiDescription Browsers get the consent screen (the SPA). The consent screen calls this route as
 * JSON to validate the request and receive a `consent_token` bound to the signed-in user.
 * Errors that may be returned to the Application carry `redirect`.
 * @apiVersion 1.0.0
 * @apiPermission user
 * @apiParam {String} response_type Must be `code`.
 * @apiParam {String} client_id
 * @apiParam {String} [redirect_uri] Required when more than one is registered.
 * @apiParam {String} [scope] Space-delimited; defaults to the Application's scopes.
 * @apiParam {String} [state]
 * @apiParam {String} [nonce]
 * @apiParam {String} code_challenge PKCE S256 challenge.
 * @apiParam {String} code_challenge_method Must be `S256`.
 */
'use strict';

const { ensureProvider, ensureSignedIn, formatJson, noStore, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  return formatJson(this, res, async () => {
    noStore(res);
    if (!ensureProvider(this, res)) return;
    let request;
    try {
      request = await this.oauth.validateAuthorizeRequest(req.query);
    } catch (err) {
      if (err.redirectUri) {
        return res.status(400).json(Object.assign(err.toJSON(), {
          redirect: this.oauth.errorRedirect(err, this.oauth.issuerFor(req))
        }));
      }
      return sendOAuthError(res, err);
    }
    if (!ensureSignedIn(req, res)) return;
    try {
      const consentToken = await this.oauth.createConsent(req.user.id, request);
      const view = await this.oauth.consentView(req.user.id, request);
      res.json(Object.assign(view, { consent_token: consentToken }));
    } catch (err) {
      sendOAuthError(res, err);
    }
  });
};
