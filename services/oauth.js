'use strict';

/**
 * OAuth 2 + OpenID Connect provider for Sensemaker Applications.
 *
 * Grants: `authorization_code` (PKCE `S256` always required), `refresh_token`
 * (rotated on every use; replaying a rotated token revokes the chain), and
 * `client_credentials` (confidential Applications only).
 *
 * Confidential Applications authenticate with a Fabric client assertion
 * (`functions/fabricClientAssertion.js`); there are no shared client secrets.
 * Codes, consent requests, access-token records, and assertion ids live in
 * Redis; Applications, authorizations, and refresh tokens live in SQL.
 */

const crypto = require('crypto');
const Actor = require('@fabric/core/types/actor');
const Key = require('@fabric/core/types/key');

const {
  ASSERTION_TYPE,
  claimAssertionId,
  parseClientAssertion,
  verifyClientAssertion
} = require('../functions/fabricClientAssertion');
const {
  SCOPES,
  SUPPORTED_SCOPES,
  USER_SCOPES,
  formatScope,
  intersectScopes,
  parseScope
} = require('../functions/oauthScopes');
const {
  ID_TOKEN_ALG,
  hashToken,
  issueAccessToken,
  issueIdToken,
  nodeJwk,
  randomToken,
  verifyAccessToken,
  verifyPkce
} = require('./oauthToken');

const PREFIX = 'sensemaker:oauth:';
const GRANT_TYPES = ['authorization_code', 'refresh_token', 'client_credentials'];
const APPLICATION_TYPES = ['confidential', 'public'];
const FORBIDDEN_REDIRECT_SCHEMES = ['javascript:', 'data:', 'file:', 'vbscript:', 'blob:', 'about:'];
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

const DEFAULTS = {
  issuer: null,
  codeTtlSeconds: 600,
  consentTtlSeconds: 600,
  accessTtlSeconds: 3600,
  refreshTtlDays: 30,
  tokenRequestsPerMinute: 60,
  maxRedirectUris: 10,
  maxApplicationsPerUser: 25
};

class OAuthError extends Error {
  constructor (error, description, status = 400) {
    super(description || error);
    this.error = error;
    this.description = description || null;
    this.status = status;
  }

  toJSON () {
    const out = { error: this.error };
    if (this.description) out.error_description = this.description;
    return out;
  }
}

function sha256 (value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function nowSeconds () {
  return Math.floor(Date.now() / 1000);
}

function cleanString (value, max) {
  if (value == null) return null;
  const out = String(value).trim();
  if (!out) return null;
  return out.slice(0, max);
}

/**
 * @param {String} uri
 * @returns {Boolean}
 */
function isAllowedRedirectUri (uri) {
  if (typeof uri !== 'string' || uri.length > 512) return false;
  let url;
  try {
    url = new URL(uri);
  } catch (err) {
    return false;
  }
  if (url.hash) return false;
  if (FORBIDDEN_REDIRECT_SCHEMES.includes(url.protocol)) return false;
  if (url.protocol === 'https:') return true;
  if (url.protocol === 'http:') return LOOPBACK_HOSTS.includes(url.hostname) || url.hostname === '::1';
  // Native and Fabric applications register private-use schemes (e.g. `fabric:` or `com.example.app:`).
  return /^[a-z][a-z0-9+.-]*:$/.test(url.protocol);
}

function isHttpUrl (value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch (err) {
    return false;
  }
}

function isCompressedPubkey (value) {
  if (typeof value !== 'string' || !/^0[23][0-9a-fA-F]{64}$/.test(value)) return false;
  try {
    new Key({ public: value }); // eslint-disable-line no-new
    return true;
  } catch (err) {
    return false;
  }
}

function appendQuery (uri, params) {
  const url = new URL(uri);
  for (const [name, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(name, value);
  }
  return url.toString();
}

class OAuthProvider {
  /**
   * @param {Object} options
   * @param {Key} options.key node root key (signs tokens)
   * @param {Object} options.store application store (`functions/applicationStore.js`)
   * @param {Object} options.redis Redis command client
   * @param {Object} [options.settings]
   */
  constructor (options = {}) {
    this.key = options.key;
    this.store = options.store;
    this.redis = options.redis;
    this.settings = Object.assign({}, DEFAULTS, options.settings || {});
  }

  get ready () {
    return !!(this.key && this.key.private && this.store && this.redis);
  }

  /**
   * Configured issuer, or the request origin when none is configured.
   * @param {Object} [req]
   * @returns {String}
   */
  issuerFor (req) {
    if (this.settings.issuer) return String(this.settings.issuer).replace(/\/+$/, '');
    const xf = req && req.headers && req.headers['x-forwarded-proto'];
    const forwarded = String(Array.isArray(xf) ? xf[0] : (xf || '')).split(',')[0].trim();
    const proto = forwarded || (req && req.protocol) || 'http';
    const host = (req && req.get) ? req.get('host') : (req && req.headers && req.headers.host);
    return `${proto}://${host || 'localhost'}`;
  }

  discovery (issuer) {
    return {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      revocation_endpoint: `${issuer}/oauth/revoke`,
      introspection_endpoint: `${issuer}/oauth/introspect`,
      userinfo_endpoint: `${issuer}/oauth/userinfo`,
      jwks_uri: `${issuer}/oauth/jwks`,
      scopes_supported: SUPPORTED_SCOPES,
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: GRANT_TYPES,
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: [ID_TOKEN_ALG],
      token_endpoint_auth_methods_supported: ['fabric_bip340', 'none'],
      revocation_endpoint_auth_methods_supported: ['fabric_bip340', 'none'],
      introspection_endpoint_auth_methods_supported: ['fabric_bip340'],
      client_assertion_types_supported: [ASSERTION_TYPE],
      code_challenge_methods_supported: ['S256'],
      claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'auth_time', 'nonce', 'name', 'preferred_username', 'email', 'email_verified'],
      authorization_response_iss_parameter_supported: true
    };
  }

  jwks () {
    return { keys: [nodeJwk(this.key)] };
  }

  // Applications

  /**
   * Validate and normalize Application fields from a request body.
   * @param {Object} input
   * @param {Object} [options]
   * @param {Object} [options.existing] Application being edited
   * @returns {Object} columns to write
   */
  normalizeApplicationInput (input = {}, options = {}) {
    const existing = options.existing || null;
    const fields = {};
    const has = (name) => Object.prototype.hasOwnProperty.call(input, name);

    if (!existing || has('name')) {
      const name = cleanString(input.name, 128);
      if (!name) throw new OAuthError('invalid_client_metadata', 'Application name is required.');
      fields.name = name;
    }
    if (has('description')) fields.description = cleanString(input.description, 2000);
    for (const [prop, column] of [['homepage_url', 'homepage_url'], ['icon_url', 'icon_url']]) {
      if (!has(prop)) continue;
      const value = cleanString(input[prop], 512);
      if (value && !isHttpUrl(value)) throw new OAuthError('invalid_client_metadata', `${prop} must be an http(s) URL.`);
      fields[column] = value;
    }

    if (!existing && has('type')) {
      if (!APPLICATION_TYPES.includes(input.type)) throw new OAuthError('invalid_client_metadata', 'type must be "confidential" or "public".');
      fields.type = input.type;
    } else if (!existing) {
      fields.type = 'confidential';
    }
    const type = existing ? existing.type : fields.type;
    fields.token_endpoint_auth_method = type === 'public' ? 'none' : 'fabric_bip340';

    if (type === 'confidential' && (!existing || has('pubkey'))) {
      const pubkey = cleanString(input.pubkey, 66);
      if (!isCompressedPubkey(pubkey)) {
        throw new OAuthError('invalid_client_metadata', 'Confidential applications need a Fabric public key (33-byte compressed secp256k1, hex).');
      }
      fields.pubkey = pubkey.toLowerCase();
    } else if (type === 'public') {
      fields.pubkey = null;
    }

    if (!existing || has('redirect_uris')) {
      const uris = Array.isArray(input.redirect_uris) ? input.redirect_uris : String(input.redirect_uris || '').split(/\s+/);
      const list = [...new Set(uris.map((u) => String(u || '').trim()).filter(Boolean))];
      if (list.length > this.settings.maxRedirectUris) throw new OAuthError('invalid_redirect_uri', `At most ${this.settings.maxRedirectUris} redirect URIs.`);
      const bad = list.find((u) => !isAllowedRedirectUri(u));
      if (bad) throw new OAuthError('invalid_redirect_uri', `Redirect URI not allowed: ${bad}`);
      fields.redirect_uris = list;
    }

    if (!existing || has('grant_types')) {
      const requested = Array.isArray(input.grant_types) ? input.grant_types : (input.grant_types ? String(input.grant_types).split(/\s+/) : ['authorization_code', 'refresh_token']);
      const grants = [...new Set(requested.filter((g) => GRANT_TYPES.includes(g)))];
      if (!grants.length) throw new OAuthError('invalid_client_metadata', 'At least one supported grant type is required.');
      if (type === 'public' && grants.includes('client_credentials')) {
        throw new OAuthError('invalid_client_metadata', 'Public applications cannot use client_credentials.');
      }
      fields.grant_types = grants;
    }

    if (!existing || has('scopes')) {
      const scopes = has('scopes') ? parseScope(input.scopes) : ['openid', 'profile'];
      if (!scopes.length) throw new OAuthError('invalid_client_metadata', 'At least one supported scope is required.');
      fields.scopes = scopes;
    }

    const grants = fields.grant_types || existing.grant_types;
    const redirects = fields.redirect_uris || existing.redirect_uris;
    if (grants.includes('authorization_code') && !redirects.length) {
      throw new OAuthError('invalid_redirect_uri', 'The authorization_code grant needs at least one redirect URI.');
    }

    if (has('status') && existing) {
      if (!['active', 'disabled'].includes(input.status)) throw new OAuthError('invalid_client_metadata', 'status must be "active" or "disabled".');
      fields.status = input.status;
    }

    return fields;
  }

  async createApplication (ownerId, input) {
    if (ownerId == null) throw new OAuthError('access_denied', 'Sign in to register an application.', 401);
    const existing = await this.store.listApplications({ ownerId });
    if (existing.length >= this.settings.maxApplicationsPerUser) {
      throw new OAuthError('invalid_request', `You can register at most ${this.settings.maxApplicationsPerUser} applications.`);
    }
    const fields = this.normalizeApplicationInput(input);
    const actor = new Actor({
      type: 'Application',
      owner: String(ownerId),
      name: fields.name,
      nonce: crypto.randomBytes(16).toString('hex')
    });
    return this.store.insertApplication(Object.assign(fields, {
      client_id: actor.id,
      owner_id: ownerId,
      status: 'active'
    }));
  }

  async updateApplication (application, input) {
    const fields = this.normalizeApplicationInput(input, { existing: application });
    const updated = await this.store.updateApplication(application.id, fields);
    const keyChanged = fields.pubkey !== undefined && fields.pubkey !== application.pubkey;
    if (updated.status !== 'active' || keyChanged) await this.revokeApplicationTokens(updated);
    return updated;
  }

  async disableApplication (application) {
    const updated = await this.store.updateApplication(application.id, { status: 'disabled' });
    await this.revokeApplicationTokens(updated);
    return updated;
  }

  async revokeApplicationTokens (application) {
    await this.store.revokeRefreshTokens({ applicationId: application.id });
    await this._markRevoked(application.client_id);
  }

  canManage (user, application) {
    if (!user || user.id == null || !application) return false;
    return !!user.is_admin || String(application.owner_id) === String(user.id);
  }

  applicationView (application, options = {}) {
    if (!application) return null;
    const view = {
      id: application.id,
      client_id: application.client_id,
      name: application.name,
      description: application.description || null,
      homepage_url: application.homepage_url || null,
      icon_url: application.icon_url || null,
      type: application.type,
      status: application.status
    };
    if (options.full) {
      Object.assign(view, {
        owner_id: application.owner_id,
        pubkey: application.pubkey || null,
        token_endpoint_auth_method: application.token_endpoint_auth_method,
        redirect_uris: application.redirect_uris,
        grant_types: application.grant_types,
        scopes: application.scopes,
        created_at: application.created_at,
        updated_at: application.updated_at
      });
    }
    return view;
  }

  // Authorization endpoint

  /**
   * Validate an authorization request. Errors that can't be sent back to the
   * client (unknown client, bad redirect) are thrown with `redirectable: false`.
   * @param {Object} query
   * @returns {Promise<Object>} normalized request
   */
  async validateAuthorizeRequest (query = {}) {
    const clientId = cleanString(query.client_id, 128);
    if (!clientId) throw new OAuthError('invalid_request', 'client_id is required.');
    const application = await this.store.findApplicationByClientId(clientId);
    if (!application || application.status !== 'active') throw new OAuthError('invalid_client', 'Unknown or disabled application.');

    let redirectUri = cleanString(query.redirect_uri, 512);
    if (!redirectUri && application.redirect_uris.length === 1) redirectUri = application.redirect_uris[0];
    if (!redirectUri || !application.redirect_uris.includes(redirectUri)) {
      throw new OAuthError('invalid_request', 'redirect_uri does not match a registered redirect URI.');
    }

    const state = cleanString(query.state, 512);
    const fail = (error, description) => {
      const err = new OAuthError(error, description);
      err.redirectUri = redirectUri;
      err.state = state;
      return err;
    };

    if (query.response_type !== 'code') throw fail('unsupported_response_type', 'Only response_type=code is supported.');
    if (!application.grant_types.includes('authorization_code')) throw fail('unauthorized_client', 'This application cannot use the authorization code flow.');
    if (!query.code_challenge) throw fail('invalid_request', 'PKCE code_challenge is required.');
    if ((query.code_challenge_method || 'plain') !== 'S256') throw fail('invalid_request', 'code_challenge_method must be S256.');
    if (!/^[A-Za-z0-9\-_]{43}$/.test(String(query.code_challenge))) throw fail('invalid_request', 'code_challenge must be a base64url SHA-256 digest.');

    const scopes = intersectScopes(query.scope || application.scopes, application.scopes);
    if (!scopes.length) throw fail('invalid_scope', 'None of the requested scopes are allowed for this application.');

    return {
      clientId: application.client_id,
      applicationId: application.id,
      redirectUri,
      scopes,
      state,
      nonce: cleanString(query.nonce, 256),
      codeChallenge: String(query.code_challenge)
    };
  }

  /**
   * Hold a validated request for the consent screen; the returned token is
   * what the consent POST must send back (binds the decision to this user).
   */
  async createConsent (userId, request) {
    const token = randomToken();
    await this.redis.set(`${PREFIX}consent:${sha256(token)}`, JSON.stringify({ userId, request }), { EX: this.settings.consentTtlSeconds });
    return token;
  }

  async takeConsent (userId, token) {
    if (!token) throw new OAuthError('invalid_request', 'consent_token is required.');
    const record = await this._consume(`${PREFIX}consent:${sha256(token)}`);
    if (!record || String(record.userId) !== String(userId)) throw new OAuthError('invalid_request', 'Consent request expired or belongs to another session.');
    return record.request;
  }

  async consentView (userId, request) {
    const application = await this.store.findApplicationByClientId(request.clientId);
    const authorization = await this.store.findAuthorization(userId, application.id);
    const granted = authorization ? authorization.scopes : [];
    return {
      application: this.applicationView(application),
      scopes: request.scopes.map((name) => ({ name, description: SCOPES[name].description })),
      redirect_uri: request.redirectUri,
      previously_authorized: request.scopes.every((name) => granted.includes(name))
    };
  }

  /**
   * Record consent and mint an authorization code.
   * @returns {Promise<String>} redirect URL carrying the code
   */
  async approve (userId, request, issuer) {
    const application = await this.store.findApplicationByClientId(request.clientId);
    if (!application || application.status !== 'active') throw new OAuthError('invalid_client', 'Unknown or disabled application.');
    const existing = await this.store.findAuthorization(userId, application.id);
    const scopes = [...new Set([].concat(existing ? existing.scopes : [], request.scopes))];
    await this.store.saveAuthorization(userId, application.id, scopes);

    const code = randomToken();
    await this.redis.set(`${PREFIX}code:${sha256(code)}`, JSON.stringify({
      clientId: application.client_id,
      userId,
      redirectUri: request.redirectUri,
      scopes: request.scopes,
      codeChallenge: request.codeChallenge,
      nonce: request.nonce,
      authTime: nowSeconds()
    }), { EX: this.settings.codeTtlSeconds });

    return appendQuery(request.redirectUri, { code, state: request.state, iss: issuer });
  }

  denyRedirect (request, issuer) {
    return appendQuery(request.redirectUri, {
      error: 'access_denied',
      error_description: 'The user declined the request.',
      state: request.state,
      iss: issuer
    });
  }

  errorRedirect (err, issuer) {
    return appendQuery(err.redirectUri, {
      error: err.error,
      error_description: err.description,
      state: err.state,
      iss: issuer
    });
  }

  async listAuthorized (userId) {
    const rows = await this.store.listAuthorizations(userId);
    const out = [];
    for (const row of rows) {
      const application = await this.store.findApplication(row.application_id);
      if (!application) continue;
      out.push({
        application: this.applicationView(application),
        scopes: row.scopes,
        authorized_at: row.created_at,
        updated_at: row.updated_at
      });
    }
    return out;
  }

  async revokeUserAuthorization (userId, application) {
    await this.store.revokeAuthorization(userId, application.id);
    await this.store.revokeRefreshTokens({ applicationId: application.id, userId });
    await this._markRevoked(application.client_id, userId);
  }

  // Client authentication

  /**
   * @param {Object} body form body of the token / revoke / introspect request
   * @param {Object} options
   * @param {String} options.issuer
   * @param {String} options.endpoint path, e.g. `/oauth/token`
   * @param {Boolean} [options.allowPublic]
   * @returns {Promise<Object>} the Application
   */
  async authenticateClient (body = {}, options = {}) {
    let clientId = cleanString(body.client_id, 128);
    const assertion = body.client_assertion;

    if (assertion) {
      if (body.client_assertion_type !== ASSERTION_TYPE) throw new OAuthError('invalid_client', `client_assertion_type must be ${ASSERTION_TYPE}.`, 401);
      const parsed = parseClientAssertion(assertion);
      if (!parsed) throw new OAuthError('invalid_client', 'Malformed client assertion.', 401);
      if (clientId && parsed.payload.iss !== clientId) throw new OAuthError('invalid_client', 'client_id does not match the client assertion.', 401);
      clientId = String(parsed.payload.iss || '');
    }

    if (!clientId) throw new OAuthError('invalid_client', 'Client authentication is required.', 401);
    const application = await this.store.findApplicationByClientId(clientId);
    if (!application || application.status !== 'active') throw new OAuthError('invalid_client', 'Unknown or disabled application.', 401);

    if (application.token_endpoint_auth_method === 'none') {
      if (assertion) throw new OAuthError('invalid_client', 'Public applications do not send client assertions.', 401);
      if (!options.allowPublic) throw new OAuthError('invalid_client', 'This endpoint requires a confidential application.', 401);
      return application;
    }

    if (!assertion) throw new OAuthError('invalid_client', 'A Fabric client assertion is required.', 401);
    const verified = verifyClientAssertion(assertion, {
      pubkey: application.pubkey,
      clientId: application.client_id,
      audience: [options.issuer, `${options.issuer}/oauth/token`, `${options.issuer}${options.endpoint || '/oauth/token'}`]
    });
    if (!verified.ok) throw new OAuthError('invalid_client', verified.error, 401);
    const fresh = await claimAssertionId(this.redis, application.client_id, verified.payload.jti, verified.payload.exp);
    if (!fresh) throw new OAuthError('invalid_client', 'Client assertion was already used.', 401);
    return application;
  }

  // Token endpoint

  async token (body = {}, options = {}) {
    const grantType = body.grant_type;
    if (!GRANT_TYPES.includes(grantType)) throw new OAuthError('unsupported_grant_type', 'Unsupported grant_type.');
    const application = await this.authenticateClient(body, {
      issuer: options.issuer,
      endpoint: '/oauth/token',
      allowPublic: grantType !== 'client_credentials'
    });
    if (!application.grant_types.includes(grantType)) throw new OAuthError('unauthorized_client', `This application cannot use ${grantType}.`);

    switch (grantType) {
      case 'authorization_code':
        return this._exchangeCode(application, body, options.issuer);
      case 'refresh_token':
        return this._refresh(application, body, options.issuer);
      case 'client_credentials':
        return this._clientCredentials(application, body);
    }
  }

  async _exchangeCode (application, body, issuer) {
    if (!body.code) throw new OAuthError('invalid_request', 'code is required.');
    const record = await this._consume(`${PREFIX}code:${sha256(body.code)}`);
    if (!record) throw new OAuthError('invalid_grant', 'Authorization code is invalid, expired, or already used.');
    if (record.clientId !== application.client_id) throw new OAuthError('invalid_grant', 'Authorization code was issued to another application.');
    if (body.redirect_uri && body.redirect_uri !== record.redirectUri) throw new OAuthError('invalid_grant', 'redirect_uri does not match the authorization request.');
    if (!verifyPkce(body.code_verifier, record.codeChallenge)) throw new OAuthError('invalid_grant', 'PKCE verification failed.');

    const authorization = await this.store.findAuthorization(record.userId, application.id);
    if (!authorization) throw new OAuthError('invalid_grant', 'The user revoked this application.');

    return this._issue(application, {
      userId: record.userId,
      scopes: record.scopes,
      nonce: record.nonce,
      authTime: record.authTime,
      issuer
    });
  }

  async _refresh (application, body, issuer) {
    if (!body.refresh_token) throw new OAuthError('invalid_request', 'refresh_token is required.');
    const tokenHash = hashToken(body.refresh_token);
    const row = await this.store.findRefreshToken(tokenHash);
    if (!row || String(row.application_id) !== String(application.id)) throw new OAuthError('invalid_grant', 'Refresh token is invalid.');
    if (row.replaced_by) {
      // A rotated token came back: assume it leaked and end the whole grant.
      await this.store.revokeRefreshTokens({ applicationId: application.id, userId: row.user_id });
      await this._markRevoked(application.client_id, row.user_id);
      throw new OAuthError('invalid_grant', 'Refresh token was already used.');
    }
    if (row.revoked_at) throw new OAuthError('invalid_grant', 'Refresh token was revoked.');
    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) throw new OAuthError('invalid_grant', 'Refresh token has expired.');

    let scopes = parseScope(row.scope);
    if (body.scope) {
      const requested = parseScope(body.scope);
      if (requested.some((name) => !scopes.includes(name))) throw new OAuthError('invalid_scope', 'Requested scope exceeds the original grant.');
      scopes = requested;
    }
    if (row.user_id != null) {
      const authorization = await this.store.findAuthorization(row.user_id, application.id);
      if (!authorization) throw new OAuthError('invalid_grant', 'The user revoked this application.');
    }

    const result = await this._issue(application, { userId: row.user_id, scopes, issuer, idToken: false });
    await this.store.markRefreshTokenReplaced(tokenHash, hashToken(result.refresh_token));
    return result;
  }

  async _clientCredentials (application, body) {
    const allowed = application.scopes.filter((name) => !USER_SCOPES.includes(name));
    const scopes = body.scope ? intersectScopes(body.scope, allowed) : allowed;
    if (!scopes.length) throw new OAuthError('invalid_scope', 'No requested scope is available to client credentials.');
    return this._issue(application, { userId: null, scopes, refresh: false, idToken: false });
  }

  async _issue (application, options) {
    const subject = options.userId != null ? String(options.userId) : `app:${application.client_id}`;
    const ttl = this.settings.accessTtlSeconds;
    const { token, payload } = issueAccessToken(this.key, {
      subject,
      clientId: application.client_id,
      scope: options.scopes,
      expiresInSeconds: ttl
    });
    await this.redis.set(`${PREFIX}access:${sha256(token)}`, JSON.stringify({
      clientId: application.client_id,
      sub: subject,
      exp: payload.exp
    }), { EX: ttl });

    const result = {
      access_token: token,
      token_type: 'Bearer',
      expires_in: ttl,
      scope: formatScope(options.scopes)
    };

    if (options.refresh !== false && options.userId != null && application.grant_types.includes('refresh_token')) {
      const refresh = randomToken();
      await this.store.insertRefreshToken({
        token_hash: hashToken(refresh),
        application_id: application.id,
        user_id: options.userId,
        scope: formatScope(options.scopes),
        expires_at: new Date(Date.now() + this.settings.refreshTtlDays * 24 * 3600 * 1000)
      });
      result.refresh_token = refresh;
    }

    if (options.idToken !== false && options.userId != null && options.scopes.includes('openid')) {
      const user = await this.store.findUser(options.userId);
      result.id_token = issueIdToken(this.key, {
        issuer: options.issuer,
        subject: subject,
        audience: application.client_id,
        nonce: options.nonce,
        authTime: options.authTime,
        claims: this._userClaims(user, options.scopes),
        expiresInSeconds: ttl
      });
    }

    return result;
  }

  // Bearer tokens

  /**
   * Verify an access token presented to Sensemaker (signature, not revoked,
   * Application still active). Client-credentials tokens act as the
   * Application's owner (`actingUserId`).
   * @param {String} wire
   * @returns {Promise<{ sub: String, userId: Number|null, actingUserId: Number|null, clientId: String, scopes: String[], iat: Number, exp: Number }|null>}
   */
  async verifyBearer (wire) {
    const parsed = verifyAccessToken(wire, this.key);
    if (!parsed) return null;
    const record = await this.redis.get(`${PREFIX}access:${sha256(wire)}`);
    if (!record) return null;
    if (await this._isRevoked(parsed.clientId, parsed.sub, parsed.iat)) return null;
    const application = await this.store.findApplicationByClientId(parsed.clientId);
    if (!application || application.status !== 'active') return null;
    const userId = /^\d+$/.test(parsed.sub) ? parseInt(parsed.sub, 10) : null;
    const ownerId = parseInt(application.owner_id, 10);
    return Object.assign({}, parsed, {
      userId,
      actingUserId: userId != null ? userId : (Number.isFinite(ownerId) ? ownerId : null)
    });
  }

  async revoke (body = {}, options = {}) {
    const application = await this.authenticateClient(body, {
      issuer: options.issuer,
      endpoint: '/oauth/revoke',
      allowPublic: true
    });
    const token = body.token;
    if (!token) throw new OAuthError('invalid_request', 'token is required.');

    if (body.token_type_hint !== 'access_token') {
      const row = await this.store.findRefreshToken(hashToken(token));
      if (row && String(row.application_id) === String(application.id)) {
        await this.store.revokeRefreshTokens({ applicationId: application.id, userId: row.user_id });
        await this._markRevoked(application.client_id, row.user_id);
        return;
      }
    }

    const parsed = verifyAccessToken(token, this.key);
    if (parsed && parsed.clientId === application.client_id) {
      await this.redis.del(`${PREFIX}access:${sha256(token)}`);
    }
  }

  async introspect (body = {}, options = {}) {
    const application = await this.authenticateClient(body, {
      issuer: options.issuer,
      endpoint: '/oauth/introspect',
      allowPublic: false
    });
    const token = body.token;
    if (!token) throw new OAuthError('invalid_request', 'token is required.');

    const access = await this.verifyBearer(token);
    if (access && access.clientId === application.client_id) {
      return {
        active: true,
        token_type: 'Bearer',
        scope: formatScope(access.scopes),
        client_id: access.clientId,
        sub: access.sub,
        iat: access.iat,
        exp: access.exp,
        iss: options.issuer
      };
    }

    const row = await this.store.findRefreshToken(hashToken(token));
    if (row && String(row.application_id) === String(application.id) && !row.revoked_at &&
      (!row.expires_at || new Date(row.expires_at).getTime() > Date.now())) {
      return {
        active: true,
        token_type: 'refresh_token',
        scope: row.scope,
        client_id: application.client_id,
        sub: row.user_id != null ? String(row.user_id) : `app:${application.client_id}`,
        exp: row.expires_at ? Math.floor(new Date(row.expires_at).getTime() / 1000) : undefined,
        iss: options.issuer
      };
    }

    return { active: false };
  }

  async userinfo (access) {
    if (!access || access.userId == null) throw new OAuthError('invalid_token', 'A user access token is required.', 401);
    if (!access.scopes.includes('openid')) throw new OAuthError('insufficient_scope', 'The openid scope is required.', 403);
    const user = await this.store.findUser(access.userId);
    if (!user) throw new OAuthError('invalid_token', 'User no longer exists.', 401);
    return Object.assign({ sub: String(user.id) }, this._userClaims(user, access.scopes));
  }

  _userClaims (user, scopes) {
    const claims = {};
    if (!user) return claims;
    if (scopes.includes('profile')) {
      claims.preferred_username = user.username;
      claims.name = user.display_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
    }
    if (scopes.includes('email') && user.email) {
      claims.email = user.email;
      claims.email_verified = false;
    }
    return claims;
  }

  /**
   * Fixed-window limit per key. Returns false once the window is exhausted.
   * @param {String} key
   * @param {Number} [limit]
   * @returns {Promise<Boolean>}
   */
  async rateLimit (key, limit = this.settings.tokenRequestsPerMinute) {
    const bucket = `${PREFIX}rate:${sha256(key)}:${Math.floor(Date.now() / 60000)}`;
    const count = await this.redis.incr(bucket);
    if (count === 1) await this.redis.expire(bucket, 60);
    return count <= limit;
  }

  async _consume (redisKey) {
    const raw = await this.redis.get(redisKey);
    if (!raw) return null;
    // Only the caller whose DEL removed the key may use it (single use under races).
    const removed = await this.redis.del(redisKey);
    if (Number(removed) !== 1) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  async _markRevoked (clientId, userId) {
    const key = userId != null ? `${PREFIX}revoked:${clientId}:${userId}` : `${PREFIX}revoked:${clientId}`;
    await this.redis.set(key, String(nowSeconds()), { EX: this.settings.accessTtlSeconds });
  }

  async _isRevoked (clientId, sub, iat) {
    const keys = [`${PREFIX}revoked:${clientId}`];
    if (/^\d+$/.test(String(sub))) keys.push(`${PREFIX}revoked:${clientId}:${sub}`);
    for (const key of keys) {
      const marker = await this.redis.get(key);
      if (marker && Number(iat) <= Number(marker)) return true;
    }
    return false;
  }
}

module.exports = {
  GRANT_TYPES,
  OAuthError,
  OAuthProvider,
  isAllowedRedirectUri
};
