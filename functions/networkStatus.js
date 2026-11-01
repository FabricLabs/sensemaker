'use strict';

/**
 * Peer rows for a Hub-shaped network status payload.
 * @param {object|null} peer
 * @returns {object[]}
 */
function peerList (peer) {
  if (!peer) return [];
  try {
    const list = peer.knownPeers;
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

/**
 * Status object for `GetNetworkStatus` and `ListPeers`.
 * Sensemaker does not run Hub's RPC start phase, so the browser bridge
 * needs this shape from the local Fabric peer instead.
 * @param {object} node
 * @returns {object}
 */
function buildNetworkStatus (node) {
  const http = node && node.http;
  const peer = (node && node.fabric && node.fabric.agent) || (node && node.agent) || null;
  let fabricPeerId = null;
  try {
    if (peer && peer.id) fabricPeerId = String(peer.id);
  } catch (_) {}
  const webrtcPeers = http && Array.isArray(http.webrtcPeerList) ? http.webrtcPeerList : [];
  const agent = http && http.agent;
  return {
    clock: http && http.clock != null ? http.clock : 0,
    fabricPeerId,
    network: {
      address: agent && agent.listenAddress ? agent.listenAddress : null,
      listening: !!(agent && agent.listening)
    },
    peers: peerList(peer),
    webrtcPeers,
    state: (http && http.state) ? http.state : { status: 'STARTED' }
  };
}

module.exports = { buildNetworkStatus };
