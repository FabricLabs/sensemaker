'use strict';

/**
 * GET /workers/playnet-receive-address — playnet (regtest) address for donating to this host.
 */
module.exports = async function (req, res) {
  if (!req.user || req.user.id == null) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const address = await this._ensurePlaynetDonationAddress();
  if (!address) {
    return res.status(503).json({
      error: 'Playnet Bitcoin is not connected. Check regtest RPC (default 127.0.0.1:18443).',
      nodeName: this.settings.name
    });
  }
  return res.json({
    ok: true,
    nodeName: this.settings.name,
    network: 'regtest',
    address
  });
};
