/**
 * @api {post} /oauth/revoke Revoke Token
 * @apiName OAuthRevoke
 * @apiGroup OAuth
 * @apiDescription RFC 7009. Revoking a refresh token ends the whole grant for that user.
 * Unknown tokens still return 200.
 * @apiVersion 1.0.0
 * @apiParam {String} token
 * @apiParam {String="access_token","refresh_token"} [token_type_hint]
 */
'use strict';

const { allowCors, ensureProvider, noStore, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  allowCors(res);
  noStore(res);
  if (!ensureProvider(this, res)) return;
  try {
    await this.oauth.revoke(req.body || {}, { issuer: this.oauth.issuerFor(req) });
    res.status(200).end();
  } catch (err) {
    sendOAuthError(res, err);
  }
};
