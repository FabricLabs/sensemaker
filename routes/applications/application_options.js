'use strict';

const { SCOPES } = require('../../functions/oauthScopes');
const { GRANT_TYPES } = require('../../services/oauth');

module.exports = async function (req, res, next) {
  res.send({
    type: 'Resource',
    content: {
      name: 'Applications',
      description: 'OAuth clients: downstream Discord bots, Fabric applications, and anything else that signs users in with Sensemaker.',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      properties: {
        id: { type: 'number', description: 'Numeric identifier.' },
        client_id: { type: 'string', description: 'OAuth client_id (Fabric Actor id).' },
        name: { type: 'string', description: 'Display name shown on the consent screen.' },
        type: { type: 'string', enum: ['confidential', 'public'], description: 'Confidential Applications sign Fabric client assertions; public ones use PKCE only.' },
        pubkey: { type: 'string', description: 'Compressed secp256k1 public key (hex) for client assertions.' },
        redirect_uris: { type: 'array', items: { type: 'string' } },
        grant_types: { type: 'array', items: { type: 'string', enum: GRANT_TYPES } },
        scopes: { type: 'array', items: { type: 'string', enum: Object.keys(SCOPES) } },
        status: { type: 'string', enum: ['active', 'disabled'] }
      },
      scopes: Object.entries(SCOPES).map(([name, scope]) => ({ name, description: scope.description }))
    }
  });
};
