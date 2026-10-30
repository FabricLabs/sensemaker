/**
 * @api {delete} /applications/:id Disable Application
 * @apiName DeleteApplication
 * @apiGroup Applications
 * @apiDescription Disables the Application and revokes its tokens. The record is kept so its
 * client_id is never reused.
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
    const disabled = await this.oauth.disableApplication(application);
    res.json(this.oauth.applicationView(disabled, { full: true }));
  } catch (err) {
    sendOAuthError(res, err);
  }
};
