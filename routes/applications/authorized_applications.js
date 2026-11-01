/**
 * @api {get} /applications/authorized Connected Applications
 * @apiName ListAuthorizedApplications
 * @apiGroup Applications
 * @apiDescription Applications the signed-in user has authorized, with the scopes granted.
 * @apiVersion 1.0.0
 * @apiPermission user
 */
'use strict';

const { ensureProvider, ensureSignedIn, formatJson, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  return formatJson(this, res, async () => {
    if (!ensureProvider(this, res) || !ensureSignedIn(req, res)) return;
    try {
      res.json(await this.oauth.listAuthorized(req.user.id));
    } catch (err) {
      sendOAuthError(res, err);
    }
  });
};
