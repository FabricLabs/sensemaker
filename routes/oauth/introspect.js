/**
 * @api {post} /oauth/introspect Introspect Token
 * @apiName OAuthIntrospect
 * @apiGroup OAuth
 * @apiDescription RFC 7662, for confidential Applications checking tokens issued to themselves.
 * Tokens issued to another Application report `active: false`.
 * @apiVersion 1.0.0
 * @apiParam {String} token
 */
'use strict';

const { ensureProvider, noStore, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  noStore(res);
  if (!ensureProvider(this, res)) return;
  try {
    res.json(await this.oauth.introspect(req.body || {}, { issuer: this.oauth.issuerFor(req) }));
  } catch (err) {
    sendOAuthError(res, err);
  }
};
