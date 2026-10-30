/**
 * @api {post} /oauth/authorize Consent Decision
 * @apiName OAuthDecide
 * @apiGroup OAuth
 * @apiDescription Approve or deny a pending authorization request. Returns the URL to send the
 * browser back to the Application.
 * @apiVersion 1.0.0
 * @apiPermission user
 * @apiParam {String} consent_token From `GET /oauth/authorize`.
 * @apiParam {String="approve","deny"} decision
 * @apiSuccess {String} redirect
 */
'use strict';

const { ensureProvider, ensureSignedIn, noStore, sendOAuthError } = require('../../functions/oauthHttp');

module.exports = async function (req, res, next) {
  noStore(res);
  if (!ensureProvider(this, res) || !ensureSignedIn(req, res)) return;
  const body = req.body || {};
  try {
    const request = await this.oauth.takeConsent(req.user.id, body.consent_token);
    const issuer = this.oauth.issuerFor(req);
    const redirect = body.decision === 'approve'
      ? await this.oauth.approve(req.user.id, request, issuer)
      : this.oauth.denyRedirect(request, issuer);
    res.json({ redirect });
  } catch (err) {
    sendOAuthError(res, err);
  }
};
