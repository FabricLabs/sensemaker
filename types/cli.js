'use strict';

// Constants
const {
  MAX_CHAT_MESSAGE_LENGTH,
  BITCOIN_GENESIS
} = require('../constants');

// Dependencies
const blessed = require('blessed');
const merge = require('lodash.merge');

// Fabric Types
const CLI = require('@fabric/core/types/cli');
const Filesystem = require('@fabric/core/types/filesystem');
const Identity = require('@fabric/core/types/identity');

class SensemakerUI extends CLI {
  constructor (settings = {}) {
    super(settings);

    // Assign Settings
    this.settings = merge({
      debug: true,
      ephemeral: false,
      listen: false,
      peering: true, // set to true to start Peer
      render: true,
      services: [],
      network: 'regtest',
      interval: 1000,
      bitcoin: {
        mode: 'rpc', // TODO: change name of mode to `rest`?
        host: 'localhost',
        port: 8443,
        secure: false
      },
      lightning: {
        mode: 'socket',
        path: './stores/lightning-playnet/regtest/lightning-rpc'
      },
      storage: {
        path: `${process.env.HOME}/.fabric/console`
      }
    }, settings);

    // Properties
    this.screen = null;
    this.history = [];

    this.aliases = {};
    this.channels = {};
    this.commands = {};
    this.contracts = {};
    this.documents = {};
    this.elements = {};
    this.peers = {};
    this.requests = {};
    this.services = {};
    this.connections = {};

    this.fs = new Filesystem(this.settings.storage);
    this.signer = null;

    // State
    this._state = {
      anchor: null,
      balances: {
        confirmed: 0,
        immature: 0,
        trusted: 0,
        unconfirmed: 0,
      },
      content: {
        actors: {},
        bitcoin: {
          best: null,
          genesis: BITCOIN_GENESIS
        },
        documents: {},
        messages: {}
      },
      contracts: {},
      clock: 0
    };

    this.attachWallet();

    this._loadPeer();
    this._loadBitcoin();
    if (this.settings.lightning.enable) this._loadLightning();
    // this.poc = new POC();

    this.identity = new Identity(this.settings);

    // Chainable
    return this;
  }


  render () {
    if (!this.settings.render) return this;

    const self = this;

    self.screen = blessed.screen({
      smartCSR: true,
      input: this.settings.input,
      output: this.settings.output,
      terminal: this.settings.terminal,
      fullUnicode: this.settings.fullUnicode
    });

    self.elements['home'] = blessed.box({
      parent: self.screen,
      content: 'Fabric Command Line Interface\nVersion 0.0.1-dev (@martindale)',
      top: 6,
      bottom: 4,
      border: {
        type: 'line'
      },
    });

    self.elements['help'] = blessed.box({
      parent: self.screen,
      label: '[ Help ]',
      content: 'Fabric Command Line Interface\nVersion 0.0.1-dev (@martindale)',
      border: {
        type: 'line'
      },
      top: 6,
      bottom: 4,
      width: '100%'
    });

    self.elements['contracts'] = blessed.box({
      parent: self.screen,
      label: '[ Contracts ]',
      border: {
        type: 'line'
      },
      top: 6,
      bottom: 4
    });

    self.elements['contracthelp'] = blessed.text({
      parent: self.elements.contracts,
      tags: true,
      top: 1,
      left: 2,
      right: 2
    });

    self.elements['lightningbook'] = blessed.box({
      parent: self.elements.contracts,
      label: '[ Lightning ]',
      border: {
        type: 'line'
      },
      top: 6,
      // height: 10
    });

    self.elements['channellist'] = blessed.table({
      parent: self.elements.lightningbook,
      data: [
        ['ID']
      ],
      width: '100%-2'
    });

    /*
    self.elements['contractbook'] = blessed.box({
      parent: self.elements.contracts,
      label: '[ Fabric ]',
      border: {
        type: 'line'
      },
      top: 16
    });

    self.elements['contractlist'] = blessed.table({
      parent: self.elements.contractbook,
      data: [
        ['ID', 'Status', 'Type', 'Bond', 'Confirmations', 'Last Modified', 'Link']
      ],
      width: '100%-2'
    });
    */

    self.elements['network'] = blessed.list({
      parent: self.screen,
      label: '{bold}[ Network ]{/bold}',
      tags: true,
      border: {
        type: 'line'
      },
      top: 6,
      bottom: 4,
      width: '100%'
    });

    self.elements['connections'] = blessed.list({
      parent: this.elements['network'],
      top: 0,
      bottom: 0
    });

    self.elements['logBox'] = blessed.box({
      parent: self.screen,
      top: 6,
      bottom: 4,
      width: '100%'
    });

    self.elements['walletBox'] = blessed.box({
      parent: self.screen,
      label: '{bold}[ Wallet ]{/bold}',
      tags: true,
      border: {
        type: 'line'
      },
      top: 6,
      bottom: 4,
      width: '100%'
    });

    self.elements['wallethelp'] = blessed.text({
      parent: self.elements.walletBox,
      tags: true,
      top: 1,
      left: 2,
      right: 2
    });

    self.elements['outputbook'] = blessed.box({
      parent: self.elements.walletBox,
      label: '[ Unspent Outputs ]',
      border: {
        type: 'line'
      },
      top: 16
    });

    self.elements['outputlist'] = blessed.table({
      parent: self.elements.outputbook,
      data: [
        ['syncing...']
      ],
      width: '100%-2',
      top: 0,
      bottom: 0
    });

    self.elements['menu'] = blessed.listbar({
      parent: self.screen,
      top: '100%-1',
      left: 0,
      right: 8,
      style: {
        selected: {
          background: 'white',
          border: '1'
        }
      },
      commands: {
        'Help': {
          keys: ['f1'],
          callback: function () {
            this.setPane('help');
          }.bind(this)
        },
        'Console': {
          keys: ['f2'],
          callback: function () {
            this.setPane('messages');
            return true;
          }.bind(this)
        },
        'Network': {
          keys: ['f3'],
          callback: function () {
            this.setPane('network');
          }.bind(this)
        },
        'Wallet': {
          keys: ['f4'],
          callback: function () {
            this.setPane('wallet');
          }.bind(this)
        },
        'Contracts': {
          keys: ['f5'],
          callback: function () {
            this.setPane('contracts');
          }.bind(this)
        },
      }
    });

    self.elements['status'] = blessed.box({
      parent: self.screen,
      label: '{bold}[ Status ]{/bold}',
      tags: true,
      border: {
        type: 'line'
      },
      top: 0,
      height: 6,
      width: '100%'
    });

    self.elements['identity'] = blessed.box({
      parent: self.elements['status'],
      left: 1
    });

    self.elements['identityLabel'] = blessed.text({
      parent: self.elements['identity'],
      content: 'IDENTITY:',
      top: 0,
      bold: true
    });

    self.elements['identityString'] = blessed.text({
      parent: self.elements['identity'],
      content: 'loading...',
      top: 0,
      left: 10
    });

    self.elements['wallet'] = blessed.box({
      parent: self.elements['status'],
      right: 1,
      width: 29,
      height: 4
    });

    self.elements['balance'] = blessed.text({
      parent: self.elements['wallet'],
      content: '0.00000000',
      top: 0,
      right: 4
    });

    self.elements['label'] = blessed.text({
      parent: self.elements['wallet'],
      content: 'BALANCE:',
      top: 0,
      right: 29,
      bold: true
    });

    self.elements['denomination'] = blessed.text({
      parent: self.elements['wallet'],
      content: 'BTC',
      top: 0,
      right: 0
    });

    self.elements['unconfirmed'] = blessed.box({
      parent: self.elements['status'],
      top: 1,
      left: 1
    });

    self.elements['unconfirmedLabel'] = blessed.text({
      parent: self.elements['unconfirmed'],
      content: 'UNCONFIRMED:',
      top: 0,
      right: 30,
      bold: true
    });

    self.elements['unconfirmedValue'] = blessed.text({
      parent: self.elements['unconfirmed'],
      content: 'syncing...',
      top: 0,
      right: 1
    });

    self.elements['bonded'] = blessed.box({
      parent: self.elements['status'],
      top: 2,
      left: 1
    });

    self.elements['bondedLabel'] = blessed.text({
      parent: self.elements['bonded'],
      content: 'BONDED:',
      top: 0,
      right: 30,
      bold: true
    });

    self.elements['bondedValue'] = blessed.text({
      parent: self.elements['bonded'],
      content: 'syncing...',
      top: 0,
      right: 1
    });

    self.elements['progress'] = blessed.box({
      parent: self.elements['status'],
      top: 3,
      left: 1
    });

    self.elements['progressLabel'] = blessed.text({
      parent: self.elements['progress'],
      content: 'SYNC:',
      top: 0,
      right: 30,
      bold: true
    });

    self.elements['progressStatus'] = blessed.text({
      parent: self.elements['progress'],
      content: 'syncing...',
      top: 0,
      right: 1
    });

    self.elements['chain'] = blessed.box({
      parent: self.elements['status'],
      top: 1,
      left: 1,
      width: 50
    });

    self.elements['chainLabel'] = blessed.text({
      parent: self.elements['chain'],
      content: 'CHAIN TIP:',
      bold: true
    });

    self.elements['chainTip'] = blessed.text({
      parent: self.elements['chain'],
      content: 'loading...',
      left: 11,
      width: 50
    });

    self.elements['height'] = blessed.box({
      parent: self.elements['status'],
      top: 2,
      left: 1,
      width: 62
    });

    self.elements['heightLabel'] = blessed.text({
      parent: self.elements['height'],
      content: 'CHAIN HEIGHT:',
      bold: true
    });

    self.elements['heightValue'] = blessed.text({
      parent: self.elements['height'],
      content: 'loading...',
      left: 14,
      width: 50
    });

    self.elements['mempool'] = blessed.box({
      parent: self.elements['status'],
      top: 3,
      left: 1,
      width: 29
    });

    self.elements['mempoolLabel'] = blessed.text({
      parent: self.elements['mempool'],
      content: 'MEMPOOL SIZE:',
      bold: true
    });

    self.elements['mempoolCount'] = blessed.text({
      parent: self.elements['mempool'],
      content: '0',
      left: 14
    });

    // MAIN LOG OUTPUT
    self.elements['messages'] = blessed.log({
      parent: this.screen,
      label: '{bold}[ Console ]{/bold}',
      tags: true,
      border: {
        type: 'line'
      },
      scrollbar: {
        style: {
          bg: 'white',
          fg: 'blue'
        }
      },
      top: 6,
      width: '80%',
      bottom: 4,
      mouse: true,
      tags: true
    });

    self.elements['peers'] = blessed.list({
      parent: self.screen,
      label: '{bold}[ Peers ]{/bold}',
      tags: true,
      border: {
        type: 'line'
      },
      top: 6,
      left: '80%+1',
      bottom: 4
    });

    self.elements['controls'] = blessed.box({
      parent: this.screen,
      label: '{bold}[ INPUT ]{/bold}',
      tags: true,
      bottom: 1,
      height: 3,
      border: {
        type: 'line'
      }
    });

    self.elements['form'] = blessed.form({
      parent: self.elements['controls'],
      bottom: 0,
      height: 1,
      left: 1
    });

    self.elements['prompt'] = blessed.textbox({
      parent: self.elements['form'],
      name: 'input',
      input: true,
      keys: true,
      inputOnFocus: true,
      value: INPUT_HINT,
      style: {
        fg: 'grey'
      }
    });

    // Set Index for Command History
    this.elements['prompt'].historyIndex = -1;

    // Render the screen.
    self.screen.render();
    self._bindKeys();

    // TODO: clean up workaround (from https://github.com/chjj/blessed/issues/109)
    self.elements['prompt'].oldFocus = self.elements['prompt'].focus;
    self.elements['prompt'].focus = function () {
      let oldListener = self.elements['prompt'].__listener;
      let oldBlur = self.elements['prompt'].__done;

      self.elements['prompt'].removeListener('keypress', self.elements['prompt'].__listener);
      self.elements['prompt'].removeListener('blur', self.elements['prompt'].__done);

      delete self.elements['prompt'].__listener;
      delete self.elements['prompt'].__done;

      self.elements['prompt'].screen.focusPop(self.elements['prompt'])

      self.elements['prompt'].addListener('keypress', oldListener);
      self.elements['prompt'].addListener('blur', oldBlur);

      self.elements['prompt'].oldFocus();
    };

    // focus when clicked
    self.elements['form'].on('click', function () {
      self.elements['prompt'].focus();
    });

    self.elements['form'].on('submit', self._handleFormSubmit.bind(self));
    // this.focusInput();

    this.elements['identityString'].setContent(this.identity.id);
    this.setPane('messages');

    setInterval(function () {
      // self._appendMessage('10 seconds have passed.');
      // self.bitcoin.generateBlock();
    }, 10000);
  }
}

module.exports = SensemakerUI;
