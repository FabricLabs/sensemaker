'use strict';

const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

/**
 * Regtest cookie under a bitcoind datadir.
 * @param {string} datadir
 * @returns {string}
 */
function regtestCookiePath (datadir) {
  return path.join(datadir, 'regtest', '.cookie');
}

/**
 * Datadirs where a live Hub playnet (or a local regtest) may already have a cookie.
 * @param {object} [options]
 * @param {object} [options.env]
 * @param {object} [options.fs]
 * @param {string} [options.homedir]
 * @param {string} [options.cwd]
 * @returns {string|null}
 */
function findPlaynetDatadir (options) {
  const opts = options || {};
  const env = opts.env || process.env;
  const io = opts.fs || fs;
  const home = opts.homedir != null ? opts.homedir : os.homedir();
  const cwd = opts.cwd || process.cwd();
  const candidates = [];

  if (env.FABRIC_BITCOIN_COOKIE_FILE && io.existsSync(String(env.FABRIC_BITCOIN_COOKIE_FILE))) {
    return path.resolve(String(env.FABRIC_BITCOIN_COOKIE_FILE), '..', '..');
  }
  if (env.FABRIC_BITCOIN_DATADIR) candidates.push(String(env.FABRIC_BITCOIN_DATADIR));
  if (env.SENSEMAKER_PLAYNET_DATADIR) candidates.push(String(env.SENSEMAKER_PLAYNET_DATADIR));
  if (env.FABRIC_HUB_USER_DATA) {
    candidates.push(path.join(String(env.FABRIC_HUB_USER_DATA), 'stores', 'bitcoin-regtest'));
  }
  if (home) {
    candidates.push(path.join(home, 'Library', 'Application Support', 'Fabric Hub', 'stores', 'bitcoin-regtest'));
    candidates.push(path.join(home, 'Library', 'Application Support', 'Electron', 'stores', 'bitcoin-regtest'));
    candidates.push(path.join(home, '.bitcoin'));
  }
  candidates.push(path.resolve(cwd, 'stores', 'bitcoin-regtest'));
  candidates.push(path.resolve(__dirname, '../../hub.fabric.pub/stores/bitcoin-regtest'));

  for (let i = 0; i < candidates.length; i++) {
    const dir = candidates[i];
    if (dir && io.existsSync(regtestCookiePath(dir))) return dir;
  }
  return null;
}

/**
 * Bitcoin settings for Sensemaker's playnet Hub. Matches Hub: regtest RPC on
 * 18443, managed Core, cookie attach when that datadir is already locked.
 * A leftover cookie does not mean the node is running, so the datadir is reused
 * and Core stays managed. Explicit RPC user and password attach instead.
 * @param {object} [options]
 * @returns {object}
 */
function playnetBitcoinConfig (options) {
  const opts = options || {};
  const env = opts.env || process.env;
  const user = env.SENSEMAKER_PLAYNET_RPC_USER || env.FABRIC_BITCOIN_USERNAME || env.BITCOIN_RPC_USER || '';
  const pass = env.SENSEMAKER_PLAYNET_RPC_PASSWORD || env.FABRIC_BITCOIN_PASSWORD || env.BITCOIN_RPC_PASS || '';
  const hasAuth = !!(user && pass);
  const datadir = findPlaynetDatadir(opts);
  const managedEnv = env.FABRIC_BITCOIN_MANAGED;
  let managed = !hasAuth;
  if (managedEnv === 'false' || managedEnv === '0') managed = false;
  if (managedEnv === 'true' || managedEnv === '1') managed = true;

  const bitcoin = {
    enable: true,
    managed: managed,
    network: 'regtest',
    host: env.SENSEMAKER_PLAYNET_RPC_HOST || env.FABRIC_BITCOIN_HOST || '127.0.0.1',
    rpcport: Number(env.SENSEMAKER_PLAYNET_RPC_PORT || env.FABRIC_BITCOIN_RPC_PORT || 18443),
    startTimeoutMs: Number(env.SENSEMAKER_PLAYNET_START_TIMEOUT_MS || env.FABRIC_BITCOIN_START_TIMEOUT_MS || 60000),
    listen: false,
    skipPlaynetPeer: true,
    p2pAddNodes: []
  };

  if (hasAuth) {
    bitcoin.username = user;
    bitcoin.password = pass;
  }
  if (datadir) bitcoin.datadir = datadir;
  else if (managed) {
    bitcoin.datadir = env.SENSEMAKER_PLAYNET_DATADIR || env.FABRIC_BITCOIN_DATADIR || './stores/bitcoin-regtest';
  }
  return bitcoin;
}

/**
 * Wallet RPC node: an enabled Bitcoin service, then the optional regtest, then playnet.
 * @param {object} nodes
 * @returns {object|null}
 */
/**
 * True when something accepts TCP connections on the playnet RPC port.
 * @param {string} host
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function tcpPortOpen (host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: host || '127.0.0.1', port: Number(port) }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(400, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

/**
 * A stopped Core leaves `.cookie` behind. The next managed start reads that
 * file before bitcoind replaces it, then every RPC call is rejected. Remove it
 * only when the RPC port is closed so a live node keeps its cookie.
 * @param {object} [options]
 * @param {object} [options.config]
 * @param {object} [options.fs]
 * @param {function} [options.portOpen]
 * @returns {Promise<boolean>}
 */
async function clearStalePlaynetCookie (options) {
  const opts = options || {};
  const cfg = opts.config || {};
  const io = opts.fs || fs;
  if (cfg.managed === false || !cfg.datadir) return false;
  const open = opts.portOpen
    ? await opts.portOpen(cfg.host, cfg.rpcport)
    : await tcpPortOpen(cfg.host, cfg.rpcport);
  if (open) return false;
  const cookie = regtestCookiePath(cfg.datadir);
  if (!io.existsSync(cookie)) return false;
  io.unlinkSync(cookie);
  return true;
}

function selectWalletBitcoin (nodes) {
  const source = nodes || {};
  if (source.bitcoinEnabled && source.bitcoin) return source.bitcoin;
  if (source.regtest) return source.regtest;
  if (source.playnet) return source.playnet;
  return null;
}

module.exports = {
  clearStalePlaynetCookie,
  findPlaynetDatadir,
  playnetBitcoinConfig,
  regtestCookiePath,
  selectWalletBitcoin
};
