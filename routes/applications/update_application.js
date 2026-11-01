/**
 * @api {patch} /applications/:id Update Application
 * @apiName UpdateApplication
 * @apiGroup Applications
 * @apiDescription Owner or admin edits an Application. Changing the public key, or setting
 * `status` to `disabled`, revokes every token issued to it.
 * @apiVersion 1.0.0
 * @apiPermission owner
 * @apiParam {String} id Numeric id or client_id.
 */
'use strict';

const { ensureProvider, ensureSignedIn, findApplicationParam, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  if (!ensureProvider(this, res) || !ensureSignedIn(req, res)) return;
  try {
    const application = await findApplicationParam(this.oauth, req.params.id);
    if (!application || !this.oauth.canManage(req.user, application)) {
      return res.status(404).json({ error: 'not_found', error_description: 'Application not found.' });
    }
    const updated = await this.oauth.updateApplication(application, req.body || {});
    res.json(this.oauth.applicationView(updated, { full: true }));
  } catch (err) {
    sendOAuthError(res, err);
  }
};
