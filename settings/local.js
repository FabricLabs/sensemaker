'use strict';

const Environment = require('@fabric/core/types/environment');
const environment = new Environment();

environment.start();

module.exports = {
  name: 'sensemaker',
  debug: environment.readVariable('DEBUG') || false,
  seed:  environment.readVariable('FABRIC_SEED'),
  peers: [
    'localhost:7777'
  ],
  services: [
    'bitcoin',
    'discord',
    'ethereum',
    'matrix',
    'shyft',
    'twilio'
  ],
  bitcoin: {
    fullnode: true,
    authority: 'http://YOUR_RPC_USER_HERE:YOUR_RPC_PASSWORD_HERE@localhost:8443',
    network: 'regtest'
  },
  github: {
    targets: [
      'bitcoin/bitcoin',
      'FabricLabs/fabric'
    ]
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
  matrix: {
    name: '@sensemaker/core',
    handle: 'sensemaker',
    connect: true,
    homeserver: 'https://grove.chat',
    coordinator: '!CcnochnehZgASDIexN:fabric.pub',
    password: 'YOUR_MATRIX_PASSWORD_HERE'
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