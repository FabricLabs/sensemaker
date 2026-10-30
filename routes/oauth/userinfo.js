/**
 * @api {get} /oauth/userinfo UserInfo
 * @apiName OAuthUserInfo
 * @apiGroup OAuth
 * @apiDescription OpenID Connect claims for the user behind a Bearer access token with the `openid` scope.
 * @apiVersion 1.0.0
 * @apiHeader {String} Authorization `Bearer <access_token>`
 */
'use strict';

const { OAuthError } = require('../../services/oauth');
const { allowCors, ensureProvider, noStore, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  allowCors(res);
  noStore(res);
  if (!ensureProvider(this, res)) return;
  try {
    if (!req.oauth) throw new OAuthError('invalid_token', 'A valid Bearer access token is required.', 401);
    res.json(await this.oauth.userinfo(req.oauth));
  } catch (err) {
    sendOAuthError(res, err);
  }
};
