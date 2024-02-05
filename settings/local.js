'use strict';

const fs = require('fs');
const Environment = require('@fabric/core/types/environment');
const environment = new Environment();

environment.start();

// TODO: @chrisinajar
// PROJECT: @fabric/core
// Determine output of various inputs.
// Output should be deterministic, HTML-encoded applications.

const NAME = 'NOVO';
const VERSION = '0.3.0';
const {
  FIXTURE_SEED
} = require('@fabric/core/constants');

const path = require('path');
const alphaTxtPath = path.join(__dirname, '../prompts/alpha.txt');
const prompt = fs.readFileSync(alphaTxtPath, 'utf8');

/**
 * Provides the user's local settings.
 */
module.exports = {
  alias: NAME,
  domain: 'trynovo.com',
  moniker: NAME,
  release: 'beta',
  name: 'jeeves',
  mode: 'production',
  crawl: false,
  debug: false, // environment.readVariable('DEBUG') || false,
  seed:  environment.readVariable('FABRIC_SEED') || FIXTURE_SEED,
  workers: 8,
  fabric: {
    peers: ['hub.fabric.pub:7777', 'beta.jeeves.dev:7777', 'trynovo.com:7777'],
    listen: false,
    remotes: [
      { host: 'hub.fabric.pub', port: 443, secure: true },
      { host: 'beta.jeeves.dev', port: 443, secure: true, collections: ['documents', 'courts'] },
      { host: 'gamma.trynovo.com', port: 443, secure: true, collections: ['documents', 'courts'] },
      // { host: 'trynovo.com', port: 443, secure: true, collections: ['documents', 'courts'] }
    ]
  },
  db: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    user: 'db_user_jeeves',
    password: 'chahcieYishi1wuu',
    database: 'db_jeeves'
  },
  http: {
    listen: true,
    hostname: 'localhost',
    interface: '0.0.0.0',
    port: 3045
  },
  email: {
    enable: false,
    service: 'gmail',
    username: 'agent@jeeves.dev',
    password: 'generate app-specific password'
  },
  interval: 1000, // 1 Hz
  persistent: false,
  peers: [
    'localhost:7777'
  ],
  prompt: prompt.toString('utf8'),
  sandbox: {
    browser: {
      headless: true
    }
  },
  services: [
    'bitcoin',
    // 'discord',
    // 'ethereum',
    'github',
    'matrix',
    // 'shyft',
    // 'twilio'
  ],
  site: {
    title: 'Jeeves &middot; Your Legal Assistant'
  },
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
  statutes: {
    enable: false,
    jurisdictions: ['Texas']
  },
  courtlistener: {
    enable: false,
    type: 'postgresql',
    host: 'lavendar.courtlistener.com',
    database: 'courtlistener',
    username: 'django',
    password: 'QLgIPaLyQRmaHBbxIoYzRPvlVkZbYESswOtLTZzm'
  },
  google: {
    ai: {
      token: 'get from google'
    }
  },
  harvard: {
    enable: true,
    token: '83bb54f6f8f622c4b928cbdba657048007e60449'
  },
  huggingface: {
    token: 'add your huggingface token here'
  },
  lightning: {
    authority: 'unix:/SOME_PATH/lightning.sock'
  },
  matrix: {
    enable: false,
    name: '@jeeves/core',
    handle: '@jeeves:fabric.pub',
    connect: true,
    constraints: {
      sync: {
        limit: 20
      }
    },
    homeserver: 'https://fabric.pub',
    coordinator: '!MGbAhkzIzcRYgyaDUa:fabric.pub',
    token: 'syt_amVldmVz_RftFycWpngMbLYTORHii_1uS5Dp'
  },
  mysql: {
    host: 'localhost',
    port: 3306,
    username: 'dbuser_jeeves_dev',
    password: ''
  },
  pacer: {
    enable: true
  },
  openai: {
    key: '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',
    model: 'gpt-4-1106-preview'
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
  verbosity: 2,
  verify: false,
  version: VERSION
};
