'use strict';

const assert = require('assert');
const { buildNetworkStatus } = require('../../functions/networkStatus');

describe('networkStatus', function () {
  it('returns the Hub bridge shape from the Fabric peer', function () {
    const status = buildNetworkStatus({
      fabric: {
        agent: {
          id: 'abc',
          knownPeers: [{ id: 'peer-1', address: '127.0.0.1:7777', status: 'connected' }]
        }
      },
      http: {
        clock: 3,
        webrtcPeerList: [{ id: 'browser-1' }],
        agent: { listenAddress: '0.0.0.0:7777', listening: true },
        state: { status: 'STARTED' }
      }
    });

    assert.strictEqual(status.fabricPeerId, 'abc');
    assert.strictEqual(status.clock, 3);
    assert.deepStrictEqual(status.network, { address: '0.0.0.0:7777', listening: true });
    assert.strictEqual(status.peers.length, 1);
    assert.strictEqual(status.peers[0].id, 'peer-1');
    assert.strictEqual(status.webrtcPeers[0].id, 'browser-1');
  });

  it('stays empty when the peer list throws', function () {
    const status = buildNetworkStatus({
      fabric: {
        agent: {
          get knownPeers () {
            throw new Error('peer registry closed');
          }
        }
      },
      http: {}
    });

    assert.deepStrictEqual(status.peers, []);
    assert.strictEqual(status.fabricPeerId, null);
    assert.deepStrictEqual(status.network, { address: null, listening: false });
  });
});
