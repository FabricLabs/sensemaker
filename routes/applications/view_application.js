/**
 * @api {get} /applications/:id View Application
 * @apiName ViewApplication
 * @apiGroup Applications
 * @apiDescription Owners and admins see every field; other signed-in users see the public listing of an active Application.
 * @apiVersion 1.0.0
 * @apiPermission user
 * @apiParam {String} id Numeric id or client_id.
 */
'use strict';

const { ensureProvider, ensureSignedIn, findApplicationParam, formatJson, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  return formatJson(this, res, async () => {
    if (!ensureProvider(this, res) || !ensureSignedIn(req, res)) return;
    try {
      const application = await findApplicationParam(this.oauth, req.params.id);
      const manage = this.oauth.canManage(req.user, application);
      if (!application || (!manage && application.status !== 'active')) {
        return res.status(404).json({ error: 'not_found', error_description: 'Application not found.' });
      }
      res.json(this.oauth.applicationView(application, { full: manage }));
    } catch (err) {
      sendOAuthError(res, err);
    }
  });
};
