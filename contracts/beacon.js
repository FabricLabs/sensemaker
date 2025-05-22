'use strict';

// Constants
const {
  BITCOIN_GENESIS_HASH
} = require('@fabric/core/constants');

// Dependencies
const merge = require('lodash.merge');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Key = require('@fabric/core/types/key');
const Message = require('@fabric/core/types/message');

/**
 * Beacon for the Fabric network.
 */
class Beacon extends Actor {
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      debug: false,
      interval: 60000,
      key: null,
      seed: null,
      xprv: null,
      xpub: null,
      path: null,
      passphrase: null,
      state: {
        clock: 0,
        parent: null,
        timestamp: null,
        bitcoin: {
          balance: 0,
          tip: {
            height: 0,
            hash: BITCOIN_GENESIS_HASH
          }
        }
      }
    }, settings);

    // Initialize signing key from provided parameters
    if (this.settings.key && (this.settings.key.xprv || this.settings.key.seed)) {
      this.signingKey = new Key({
        xprv: this.settings.key.xprv,
        xpub: this.settings.key.xpub,
        seed: this.settings.key.seed,
        passphrase: this.settings.passphrase,
        path: this.settings.path
      });
    } else if (this.settings.seed) {
      this.signingKey = new Key({
        seed: this.settings.seed,
        passphrase: this.settings.passphrase,
        path: this.settings.path
      });
    } else if (this.settings.xprv) {
      this.signingKey = new Key({
        xprv: this.settings.xprv,
        passphrase: this.settings.passphrase,
        path: this.settings.path
      });
    } else {
      throw new Error('Beacon requires a key with xprv/seed, or individual seed/xprv for signing messages');
    }

    this._state = {
      actors: {},
      bitcoin: {
        balance: 0,
        tip: {
          height: 0,
          hash: BITCOIN_GENESIS_HASH
        }
      },
      content: this.settings.state,
      epochs: {},
      history: [],
      status: 'STOPPED'
    };

    return this;
  }

  commit () {
    const state = new Actor(this.state);
    const message = Message.fromVector(['BEACON_STATE', state]);

    // Always sign the message with our signing key
    message.signWithKey(this.signingKey);

    this.emit('message', message);

    return this;
  }

  async createEpoch () {
    const parent = new Actor(this.state);

    // Increment clock
    this._state.content.clock++;

    // Update the state
    if (this.bitcoin) {
      const address = await this.bitcoin._makeRPCRequest('getnewaddress', []);
      const generated = await this.bitcoin._makeRPCRequest('generatetoaddress', [1, address]);
      const wallet = await this.bitcoin._makeRPCRequest('getwalletinfo', []);
      const balance = await this.bitcoin._makeRPCRequest('getbalance', []);
      const blockchain = await this.bitcoin._makeRPCRequest('getblockchaininfo', []);
      const root = await this.bitcoin._makeRPCRequest('importprivkey', [this.signingKey.private, 'beacon', true]);
      if (this.settings.debug) console.debug('[BEACON]', 'Bitcoin Root Key Imported:', root);

      // Global State
      this._state.content.bitcoin.tip.height = this.bitcoin.state.height;
      this._state.content.bitcoin.tip.hash = this.bitcoin.state.tip;

      // Local State
      this._state.bitcoin.balance = balance;
    }

    // Create Epoch
    const timestamp = new Date();
    const epoch = new Actor({
      ...this.state,
      timestamp: timestamp.toISOString()
    });

    this._state.actors[epoch.id] = epoch.toJSON();
    this._state.epochs[epoch.id] = epoch.toJSON();
    this._state.history.push(epoch.id);

    this._state.content.parent = parent.id;
    this._state.content.timestamp = timestamp.toISOString();

    // Commit the state
    this.commit();

    // Announce the new epoch
    this.emit('message', Message.fromVector(['BEACON_EPOCH', epoch]).signWithKey(this.signingKey));

    return epoch;
  }

  async start () {
    if (this._state.status !== 'STOPPED') throw new Error('Beacon is already running.');
    this._state.status = 'STARTING';

    if (this.bitcoin) {
      const created = await this.bitcoin._makeRPCRequest('createwallet', ['beacon', false, false, null, true, true]);
      const loaded = await this.bitcoin._makeRPCRequest('loadwallet', ['beacon']);
      await this.bitcoin._syncWithRPC();
      if (this.bitcoin.state.height < 101) {
        const count = 101 - this.bitcoin.state.height;
        if (this.settings.debug) console.debug('[BEACON]', `Creating ${count} initial epochs...`);
        for (let i = 0; i < count; i++) {
          await this.createEpoch();
        }
      }
    }

    this.timer = setInterval(this.createEpoch.bind(this), this.settings.interval);

    this._state.status = 'RUNNING';
    return this;
  }

  async stop () {
    // If already stopped, just return
    if (this._state.status === 'STOPPED') {
      return this;
    }

    // Handle any state
    this._state.status = 'STOPPING';

    // Clear timer if exists
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Update state
    this._state.status = 'STOPPED';
    return this;
  }
}

module.exports = Beacon;
