/**
 * @api {post} /applications Create Application
 * @apiName CreateApplication
 * @apiGroup Applications
 * @apiDescription Register an OAuth client owned by the signed-in user. Confidential Applications
 * (bots, Fabric services) register a Fabric public key and sign client assertions with it; public
 * Applications (browser and native apps) use PKCE only.
 * @apiVersion 1.0.0
 * @apiPermission user
 * @apiParam {String} name Display name shown on the consent screen.
 * @apiParam {String} [description]
 * @apiParam {String} [homepage_url]
 * @apiParam {String} [icon_url]
 * @apiParam {String="confidential","public"} [type=confidential]
 * @apiParam {String} [pubkey] Compressed secp256k1 public key (hex), required for confidential Applications.
 * @apiParam {String[]} [redirect_uris] Exact redirect URIs (https, loopback http, or a private-use scheme).
 * @apiParam {String[]} [grant_types=authorization_code,refresh_token] Any of `authorization_code`, `refresh_token`, `client_credentials`.
 * @apiParam {String[]} [scopes=openid,profile] Scopes this Application may request.
 */
'use strict';

const { ensureProvider, ensureSignedIn, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  if (!ensureProvider(this, res) || !ensureSignedIn(req, res)) return;
  try {
    const application = await this.oauth.createApplication(req.user.id, req.body || {});
    res.status(201).json(this.oauth.applicationView(application, { full: true }));
  } catch (err) {
    sendOAuthError(res, err);
  }
};
