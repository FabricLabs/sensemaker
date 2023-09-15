'use strict';

const fs = require('fs');
const Environment = require('@fabric/core/types/environment');
const environment = new Environment();

environment.start();

// TODO: @chrisinajar
// PROJECT: @fabric/core
// Determine output of various inputs.
// Output should be deterministic, HTML-encoded applications.

const NAME = 'ALPHA';
const VERSION = '0.2.2'; // TODO: 0.2.1-pre
const path = require('path');
const alphaTxtPath = path.join(__dirname, '../prompts/alpha.txt');
const prompt = fs.readFileSync(alphaTxtPath, 'utf8');


/**
 * Provides the user's local settings.
 */
module.exports = {
  alias: 'JeevesAI',
  moniker: NAME,
  name: 'jeeves',
  crawl: true,
  debug: environment.readVariable('DEBUG') || false,
  seed:  environment.readVariable('FABRIC_SEED'),
  workers: 8,
  db: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    user: 'db_user_jeeves',
    password: 'YOUR MYSQL PASSWORD',
    database: 'db_jeeves'
  },
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
  harvard: {
    token: 'GET FROM CASE.LAW'
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
    handle: '@jeeves:fabric.pub',
    connect: true,
    constraints: {
      sync: {
        limit: 20
      }
    },
    homeserver: 'https://fabric.pub',
    coordinator: '!MGbAhkzIzcRYgyaDUa:fabric.pub',
    token: 'GET FROM MATRIX'
  },
  mysql: {
    host: 'localhost',
    port: 3306,
    username: 'dbuser_jeeves_dev',
    password: ''
  },
  openai: {
    key: 'GET FROM OPENAI',
    model: 'gpt-3.5-turbo-16k'
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
  verbosity: 2,
  version: VERSION
}
