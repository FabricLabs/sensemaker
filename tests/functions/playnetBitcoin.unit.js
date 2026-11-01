'use strict';

const assert = require('assert');
const path = require('path');
const {
  clearStalePlaynetCookie,
  findPlaynetDatadir,
  playnetBitcoinConfig,
  regtestCookiePath,
  selectWalletBitcoin
} = require('../../functions/playnetBitcoin');

function memoryFs (files) {
  const set = new Set(files);
  return {
    existsSync (file) {
      return set.has(file);
    }
  };
}

describe('playnet bitcoin', function () {
  it('uses Hub regtest defaults when nothing is already running', function () {
    const bitcoin = playnetBitcoinConfig({
      env: {},
      fs: memoryFs([]),
      homedir: '/tmp/empty-home',
      cwd: '/tmp/empty-cwd'
    });
    assert.strictEqual(bitcoin.network, 'regtest');
    assert.strictEqual(bitcoin.rpcport, 18443);
    assert.strictEqual(bitcoin.managed, true);
    assert.strictEqual(bitcoin.listen, false);
    assert.strictEqual(bitcoin.skipPlaynetPeer, true);
    assert.strictEqual(bitcoin.username, undefined);
    assert.strictEqual(bitcoin.datadir, './stores/bitcoin-regtest');
  });

  it('reuses a playnet datadir and keeps Core managed when the node is stopped', function () {
    const datadir = path.join('/Users/hub', 'Library', 'Application Support', 'Fabric Hub', 'stores', 'bitcoin-regtest');
    const cookie = path.join(datadir, 'regtest', '.cookie');
    const bitcoin = playnetBitcoinConfig({
      env: {},
      fs: memoryFs([cookie]),
      homedir: '/Users/hub',
      cwd: '/tmp/sensemaker'
    });
    assert.strictEqual(bitcoin.managed, true);
    assert.strictEqual(bitcoin.datadir, datadir);
    assert.strictEqual(bitcoin.rpcport, 18443);
    assert.strictEqual(bitcoin.username, undefined);
  });

  it('attaches to explicit RPC credentials', function () {
    const bitcoin = playnetBitcoinConfig({
      env: {
        SENSEMAKER_PLAYNET_RPC_USER: 'rpcuser',
        SENSEMAKER_PLAYNET_RPC_PASSWORD: 'rpcpass',
        SENSEMAKER_PLAYNET_RPC_PORT: '18443'
      },
      fs: memoryFs([]),
      homedir: '/tmp/empty-home',
      cwd: '/tmp/empty-cwd'
    });
    assert.strictEqual(bitcoin.managed, false);
    assert.strictEqual(bitcoin.username, 'rpcuser');
    assert.strictEqual(bitcoin.password, 'rpcpass');
    assert.strictEqual(bitcoin.rpcport, 18443);
  });

  it('finds a cookie file passed in the environment', function () {
    const cookie = '/var/lib/bitcoin/regtest/.cookie';
    const found = findPlaynetDatadir({
      env: { FABRIC_BITCOIN_COOKIE_FILE: cookie },
      fs: memoryFs([cookie]),
      homedir: '/tmp/empty-home',
      cwd: '/tmp/empty-cwd'
    });
    assert.strictEqual(found, path.resolve('/var/lib/bitcoin'));
  });

  it('drops a leftover cookie when regtest RPC is down', async function () {
    const datadir = '/tmp/playnet-datadir';
    const cookie = regtestCookiePath(datadir);
    const removed = [];
    const io = {
      existsSync (file) { return file === cookie; },
      unlinkSync (file) { removed.push(file); }
    };
    const cleared = await clearStalePlaynetCookie({
      config: { managed: true, datadir: datadir, host: '127.0.0.1', rpcport: 18443 },
      fs: io,
      portOpen: async () => false
    });
    assert.strictEqual(cleared, true);
    assert.deepStrictEqual(removed, [cookie]);
  });

  it('keeps the cookie when regtest RPC is already up', async function () {
    const datadir = '/tmp/playnet-datadir';
    let unlinked = false;
    const io = {
      existsSync () { return true; },
      unlinkSync () { unlinked = true; }
    };
    const cleared = await clearStalePlaynetCookie({
      config: { managed: true, datadir: datadir, host: '127.0.0.1', rpcport: 18443 },
      fs: io,
      portOpen: async () => true
    });
    assert.strictEqual(cleared, false);
    assert.strictEqual(unlinked, false);
  });

  it('prefers an enabled Bitcoin service, then regtest, then playnet', function () {
    const main = { name: 'main' };
    const regtest = { name: 'regtest' };
    const playnet = { name: 'playnet' };
    assert.strictEqual(selectWalletBitcoin({
      bitcoinEnabled: true,
      bitcoin: main,
      regtest: regtest,
      playnet: playnet
    }), main);
    assert.strictEqual(selectWalletBitcoin({
      bitcoinEnabled: false,
      bitcoin: null,
      regtest: regtest,
      playnet: playnet
    }), regtest);
    assert.strictEqual(selectWalletBitcoin({
      bitcoinEnabled: false,
      playnet: playnet
    }), playnet);
    assert.strictEqual(selectWalletBitcoin({ bitcoinEnabled: false }), null);
  });
});
