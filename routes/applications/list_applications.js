/**
 * @api {get} /applications List Applications
 * @apiName ListApplications
 * @apiGroup Applications
 * @apiDescription Applications registered by the signed-in user. Admins may pass `?all=1` to list every Application.
 * @apiVersion 1.0.0
 * @apiPermission user
 * @apiParam {String} [all] `1` lists every Application (admins only).
 */
'use strict';

const { ensureProvider, ensureSignedIn, formatJson, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  return formatJson(this, res, async () => {
    if (!ensureProvider(this, res) || !ensureSignedIn(req, res)) return;
    try {
      const all = req.query.all === '1' && await this._userHasAdminAccess(req);
      const applications = await this.oauth.store.listApplications(all ? {} : { ownerId: req.user.id });
      res.json(applications.map((application) => this.oauth.applicationView(application, { full: true })));
    } catch (err) {
      sendOAuthError(res, err);
    }
  });
};
