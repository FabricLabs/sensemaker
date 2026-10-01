'use strict';

/**
 * GET /workers/state — local active worker queue snapshot (depth, busy, idle).
 * Future: Fabric-registered work contracts for paid parallel execution will extend this namespace.
 */
module.exports = async function (req, res) {
  if (!req.user || req.user.id == null) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const q = this.activeWorkerQueue;
  if (!q) {
    return res.json({
      ok: true,
      worker: false,
      nodeName: this.settings.name,
      queueDepth: 0,
      busy: false,
      jobKind: null,
      playnetBitcoinReady: !!(this.playnet && this.playnet.bitcoin)
    });
  }
  let queueDepth = 0;
  try {
    queueDepth = await q.queueDepth();
  } catch (e) {
    queueDepth = -1;
  }
  const snap = q.snapshotSync();
  const playnetBtc = this.playnet && this.playnet.bitcoin;
  return res.json({
    ok: true,
    worker: true,
    nodeName: this.settings.name,
    queueDepth,
    busy: snap.busy,
    idleMs: snap.idleMs,
    transport: snap.mode,
    jobKind: this._workerJobKind || null,
    playnetBitcoinReady: !!(playnetBtc && typeof playnetBtc._makeRPCRequest === 'function')
  });
};
