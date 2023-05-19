'use strict';

const Environment = require('@fabric/core/types/environment');
const environment = new Environment();

environment.start();

module.exports = {
  alias: 'JEEVES',
  name: 'jeeves',
  debug: environment.readVariable('DEBUG') || false,
  seed:  environment.readVariable('FABRIC_SEED'),
  http: {
    listen: true,
    hostname: 'localhost',
    interface: '0.0.0.0',
    port: 3045
  },
  interval: 1000, // 1 Hz
  persistent: false,
  peers: [
    'localhost:7777'
  ],
  services: [
    'bitcoin',
    // 'discord',
    // 'ethereum',
    'github',
    'matrix',
    // 'shyft',
    // 'twilio'
  ],
  triggers: {
    'chief2ieshu2ig1kohquahngooQuoob3': {
      method: '_notifyHoneyPotMonitor'
    }
  },
  bitcoin: {
    fullnode: false,
    authority: 'http://YOUR_RPC_USER_HERE:YOUR_RPC_PASSWORD_HERE@localhost:8443',
    network: 'regtest'
  },
  github: {
    interval: 10000,
    targets: [
      'bitcoin/bitcoin',
      'FabricLabs/fabric'
    ],
    token: null
  },
  discord: {
    alerts: [
      '504047881427091472'
    ],
    app: {
      id: '898417891215564851',
      key: '27a59063c0d577e11099dd4668fca31ec25fdd57f4e158350c35d7d411be377a'
    },
    auth: {
      id: 'your_discord_auth_id_here',
      secret: 'your_discord_auth_secret_here'
    },
    token: 'your_discord_auth_token_here'
  },
  ethereum: {
    interval: 12000
  },
  lightning: {
    authority: 'unix:/SOME_PATH/lightning.sock'
  },
  matrix: {
    name: '@jeeves/core',
    handle: 'jeeves',
    connect: true,
    homeserver: 'https://grove.chat',
    coordinator: '!CcnochnehZgASDIexN:fabric.pub',
    password: 'YOUR_MATRIX_PASSWORD_HERE'
  },
  openai: {
    key: 'GET FROM OPENAI'
  },
  twilio: {
    sid: 'add your twilio sid here',
    token: 'add your twilio token here',
    from: 'FROM_PHONE_HERE',
    alerts: []
  },
  twitter: {
    consumer: {
      key: 'replace with consumer key',
      secret: 'replace with consumer secret'
    },
    token: {
      key: 'replace with token key',
      secret: 'replace with token secret'
    },
    keywords: ['#bitcoin'],
    targets: [
      'FabricLabs',
      'martindale'
    ]
  },
  shyft: {
    name: 'TYPHOON',
    interval: 5000
  },
  verbosity: 2
}
