/**
 * @api {delete} /applications/:id/authorization Revoke Application Access
 * @apiName RevokeApplicationAuthorization
 * @apiGroup Applications
 * @apiDescription The signed-in user withdraws an Application's access; its tokens for this user stop working.
 * @apiVersion 1.0.0
 * @apiPermission user
 * @apiParam {String} id Numeric id or client_id.
 */
'use strict';

const { ensureProvider, ensureSignedIn, findApplicationParam, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  if (!ensureProvider(this, res) || !ensureSignedIn(req, res)) return;
  try {
    const application = await findApplicationParam(this.oauth, req.params.id);
    if (!application) return res.status(404).json({ error: 'not_found', error_description: 'Application not found.' });
    await this.oauth.revokeUserAuthorization(req.user.id, application);
    res.status(204).end();
  } catch (err) {
    sendOAuthError(res, err);
  }
};
