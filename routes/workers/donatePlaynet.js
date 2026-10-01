'use strict';

/**
 * POST /workers/donate-playnet — spend from the node’s playnet wallet to this host’s donation address.
 *
 * Body: `{ "amountSats": number }` (min 546). Intended for shared regtest / playnet setups; production
 * flows should use per-user signing or contracts.
 */
module.exports = async function (req, res) {
  if (!req.user || req.user.id == null) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const btc = this.playnet && this.playnet.bitcoin;
  if (!btc) {
    return res.status(503).json({ error: 'Playnet Bitcoin is not available on this node.' });
  }
  const body = req.body || {};
  const amountSats = Math.round(Number(body.amountSats || 0));
  if (!Number.isFinite(amountSats) || amountSats < 546) {
    return res.status(400).json({ error: 'amountSats must be a number ≥ 546 (dust limit).' });
  }
  const to = await this._ensurePlaynetDonationAddress();
  if (!to) {
    return res.status(503).json({ error: 'Could not resolve host playnet receive address.' });
  }
  const amountBTC = Number((amountSats / 100000000).toFixed(8));
  try {
    const txid = await btc._processSpendMessage({
      destination: to,
      amount: amountBTC,
      comment: `donation:user:${req.user.id}`
    });
    return res.json({
      ok: true,
      network: 'regtest',
      txid,
      destination: to,
      amountSats,
      nodeName: this.settings.name
    });
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
};
