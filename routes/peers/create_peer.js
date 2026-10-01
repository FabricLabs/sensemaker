'use strict';

const crypto = require('crypto');
const Actor = require('@fabric/core/types/actor');

/**
 * Resolve Fabric P2P dial target from JSON body (REST POST /peers).
 * Accepts connectionString, host[/port/pubkey], or address when shaped like host:port / pubkey@host:port.
 */
function resolveP2PConnectionString (body) {
  if (!body || typeof body !== 'object') return '';
  let s = (body.connectionString && String(body.connectionString).trim()) || '';
  if (!s && body.host) {
    const targetPort = body.port != null ? Number(body.port) : 7777;
    const host = String(body.host).trim();
    const pk = body.pubkey ? String(body.pubkey).trim() : '';
    s = pk ? `${pk}@${host}:${targetPort}` : `${host}:${targetPort}`;
  }
  if (!s && body.address) {
    const addr = String(body.address).trim();
    if (addressFieldIsP2PTarget(addr)) s = addr;
  }
  return s;
}

/** True when `address` is host:port or pubkey@host:port, not a URL or free-form label. */
function addressFieldIsP2PTarget (addr) {
  if (!addr || typeof addr !== 'string') return false;
  const s = addr.trim();
  if (/^https?:\/\//i.test(s)) return false;
  if (s.includes('@')) return /^[^@\s]+@[^@\s]+:\d{2,5}$/.test(s);
  return /^[\w.-]+:\d{2,5}$/.test(s);
}

function registryPublicId (agent, addressKey) {
  const info = agent.peers && agent.peers[addressKey];
  if (!info) return null;
  const id = info.publicKey || info.id;
  return id != null ? String(id) : null;
}

async function requireAdminIfDb (self, req, res) {
  if (!self.db) return true;
  if (await self._userHasAdminAccess(req)) return true;
  self._sendSensemakerAdminRequiredJson(req, res);
  return false;
}

/**
 * POST /peers — ensure outbound Fabric P2P connection (idempotent) or legacy Actor stub.
 */
module.exports = async function (req, res, next) {
  const body = req.body || {};
  const connectionString = resolveP2PConnectionString(body);

  if (connectionString) {
    res.format({
      html: () => res.send(this.applicationString),
      json: async () => {
        try {
          if (!(await requireAdminIfDb(this, req, res))) return;

          if (!this.fabric || !this.fabric.agent) {
            return res.status(500).json({ success: false, error: 'No Fabric peer available.' });
          }

          const agent = this.fabric.agent;
          const alreadyConnected = !!(agent.connections && agent.connections[connectionString]);
          let publicId = registryPublicId(agent, connectionString);

          this.fabric._connect(connectionString);

          if (!publicId) publicId = registryPublicId(agent, connectionString);

          const stableId = publicId || connectionString.replace(/[:.@]/g, '-');

          return res.status(200).json({
            success: true,
            id: stableId,
            peer: {
              address: connectionString,
              publicId: publicId || null
            },
            alreadyConnected,
            idempotent: true,
            message: alreadyConnected
              ? `Already connected; identity consolidated at ${connectionString}.`
              : `Connection initiated to ${connectionString}.`
          });
        } catch (error) {
          console.error('[SENSEMAKER:CORE]', '[HTTP]', 'POST /peers (P2P) failed:', error);
          return res.status(500).json({
            success: false,
            error: error.message || 'Failed to connect to peer'
          });
        }
      }
    });
    return;
  }

  const now = new Date();
  const proposal = { ...body };

  if (!proposal.address) {
    return res.status(400).json({
      success: false,
      error: 'Provide a P2P target (connectionString, host, or address as host:port / pubkey@host:port), or legacy address for peer proposal.'
    });
  }

  proposal.created = now.toISOString();
  proposal.nonce = crypto.randomBytes(64).toString('hex');

  const actor = new Actor(proposal);

  console.debug('todo: create peer here...');

  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: () => {
      res.json({
        id: actor.id
      });
    }
  });
};
