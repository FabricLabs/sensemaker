'use strict';

function normalizeAddressPort (host, port) {
  const p = port != null && String(port).length ? String(port) : '7777';
  return `${host}:${p}`;
}

function tagPeerRow (row, federationMembers) {
  if (!federationMembers || !federationMembers.length) return row;
  const key = normalizeAddressPort(row.address, row.port);
  const match = federationMembers.find((m) => {
    const addr = m.address || normalizeAddressPort(m.host, m.port);
    return addr === key;
  });
  if (!match) return row;
  return {
    ...row,
    federationId: match.id,
    federationLabel: match.label
  };
}

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      // Check if Fabric service is available
      if (!this.fabric || !this.fabric.agent) {
        return res.status(500).json({
          success: false,
          error: 'No Fabric peer available.',
          peers: [],
          stats: { total: 0, connected: 0, configured: 0, active_connections: 0 }
        });
      }

      console.debug('[SENSEMAKER:CORE]', '[HTTP]', 'GET /peers - Listing Fabric peers...');

      try {
        const peer = this.fabric.agent;
        const fabricSettings = this.settings.fabric || {};
        const federationMembers = Array.isArray(fabricSettings.federationMembers)
          ? fabricSettings.federationMembers
          : [];
        const selfNode = fabricSettings.selfNode || null;

        const connectedPeers = [];
        const configuredPeers = [];

        // Get active connections
        const connections = Object.keys(peer.connections || {});
        for (const connectionId of connections) {
          const [host, port] = connectionId.split(':');
          const connection = peer.connections[connectionId];

          // Get peer info from the peers registry if available
          const peerInfo = peer.peers ? peer.peers[connectionId] : null;
          const peerID = peerInfo?.publicKey || peerInfo?.id || null;
          const peerAlias = connection?._alias || peerInfo?.alias || null;

          connectedPeers.push(tagPeerRow({
            id: connectionId.replace(/[:.]/g, '-'),
            peerID: peerID, // Actual peer ID (public key)
            alias: peerAlias, // Published alias if available
            title: peerAlias ? `${peerAlias} (${host})` : `Connected Peer (${host})`,
            address: host,
            port: port || '7777',
            protocol: 'tcp',
            connected: true,
            description: `Active connection to ${connectionId}`,
            connectionId: connectionId
          }, federationMembers));
        }

        // Get configured peers (from settings)
        const configuredPeersList = peer.settings.peers || [];
        for (const peerAddress of configuredPeersList) {
          const [host, port] = peerAddress.split(':');
          const isConnected = connections.includes(peerAddress);

          if (!isConnected) {
            // Check if this is a pubkey@host:port format
            let peerID = null;
            let displayHost = host;

            if (host.includes('@')) {
              const [pubkey, actualHost] = host.split('@');
              peerID = pubkey;
              displayHost = actualHost;
            }

            configuredPeers.push(tagPeerRow({
              id: peerAddress.replace(/[:.@]/g, '-'),
              peerID: peerID, // Peer ID if specified in config
              alias: null, // No alias for unconnected peers
              title: peerID ? `${peerID.substring(0, 8)}...@${displayHost}` : `Configured Peer (${displayHost})`,
              address: displayHost,
              port: port || '7777',
              protocol: 'tcp',
              connected: false,
              description: `Configured peer: ${peerAddress}`,
              connectionId: peerAddress
            }, federationMembers));
          }
        }

        // Add local peer info
        const localPeer = {
          id: 'local-instance',
          peerID: peer.identity?.id || peer.id || null, // Local peer ID
          alias: peer.settings.alias || 'Local Node', // Local alias
          title: 'Local Instance',
          address: peer.settings.interface || '127.0.0.1',
          port: peer.settings.port?.toString() || '7777',
          protocol: 'tcp',
          connected: true,
          description: 'Local Fabric node',
          isLocal: true,
          pubkey: peer.identity?.id || peer.id || null,
          federationId: selfNode || undefined,
          federationLabel: selfNode
            ? (federationMembers.find((m) => m.id === selfNode) || {}).label || 'This federation node'
            : undefined,
          sensemakerAgent: {
            name: this.settings.name || 'Sensemaker',
            fabricPeerId: peer.identity?.id || peer.id || null
          }
        };

        const allPeers = [localPeer, ...connectedPeers, ...configuredPeers];
        const response = {
          success: true,
          peers: allPeers,
          stats: {
            total: allPeers.length,
            connected: connectedPeers.length + 1, // +1 for local
            configured: configuredPeersList.length,
            active_connections: connections.length
          },
          federation: {
            self: selfNode,
            members: federationMembers
          },
          timestamp: new Date().toISOString()
        };

        console.debug('[SENSEMAKER:CORE]', '[HTTP]', 'GET /peers - Peer list generated:', response.stats);
        res.json(response);
      } catch (error) {
        console.error('[SENSEMAKER:CORE]', '[HTTP]', 'GET /peers - Failed to list peers:', error);

        res.status(500).json({
          success: false,
          error: error.message || 'Failed to list peers',
          peers: [],
          stats: {
            total: 0,
            connected: 0,
            configured: 0,
            active_connections: 0
          }
        });
      }
    }
  });
};
