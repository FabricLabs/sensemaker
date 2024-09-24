/**
 * Provides the user's local settings.
 */
'use strict';

// Dependencies
const fs = require('fs');
const path = require('path');
const merge = require('lodash.merge');

// Environment
const Environment = require('@fabric/core/types/environment');
const environment = new Environment();

environment.start();

// TODO: @chrisinajar
// PROJECT: @fabric/core
// Determine output of various inputs.
// Output should be deterministic, HTML-encoded applications.

// Constants
const NAME = 'SENSEMAKER';
const VERSION = '1.0.0-RC2';
const {
  FIXTURE_SEED
} = require('@fabric/core/constants');

// Prompts
const promptPath = path.join(__dirname, '../prompts/sensemaker.txt');
const basePrompt = fs.readFileSync(promptPath, 'utf8');

// Configurations
const network = require('./network');

/**
 * Provides the user's local settings.
 */
module.exports = {
  alias: NAME,
  benchmark: false,
  domain: 'sensemaker.io', // TODO: implement network-wide document search, use `novo` as canonical domain
  moniker: NAME,
  release: 'beta',
  name: 'Sensemaker',
  mode: 'production',
  expander: true,
  crawl: false,
  debug: false, // environment.readVariable('DEBUG') || false,
  seed:  environment.readVariable('FABRIC_SEED') || FIXTURE_SEED,
  temperature: 0,
  trainer: {
    enable: false,
    hosts: ['localhost:7777'],
    interval: 1000,
    limit: 10
  },
  worker: true,
  workers: 8,
  agents: merge({
    local: {
      name: 'LOCAL',
      prompt: basePrompt.toString('utf8'),
      model: 'llama3',
      host: '127.0.0.1',
      port: 11434,
      secure: false,
      temperature: 0
    }
  }, network, {}),
  pipeline: {
    enable: false,
    consensus: ['socrates']
  },
  fabric: {
    peers: ['hub.fabric.pub:7777', 'hub.sensemaker.io:7777', 'beta.jeeves.dev:7777', 'trynovo.com:7777'],
    listen: false,
    remotes: [
      // { host: 'hub.fabric.pub', port: 443, secure: true },
      { host: 'beta.jeeves.dev', port: 443, secure: true, collections: ['documents', 'courts'] },
      // { host: 'gamma.trynovo.com', port: 443, secure: true, collections: ['documents', 'courts'] },
      { host: 'trynovo.com', port: 443, secure: true, collections: ['documents', 'courts'] }
    ],
    search: true,
    sync: false
  },
  db: {
    type: 'mysql',
    host: process.env.SQL_DB_HOST || '127.0.0.1',
    port: 3306,
    user: 'db_user_jeeves',
    password: process.env.SQL_DB_CRED || 'chahcieYishi1wuu',
    database: 'db_jeeves'
  },
  discord: {
    enable: true,
    app: {
      id: 'get from discord',
      secret: 'get from discord'
    },
    coordinator: 'get from discord', // #sensemaker on Fabric Discord
    token: 'get from discord'
  },
  embeddings: {
    enable: false
  },
  goals: {
    'primary': {
      'name': 'Primary Goal',
      'description': 'The primary goal of the system is to provide a safe, secure, and reliable environment for the user to interact with the system.',
      'status': 'active'
    },
    'secondary': {
      'name': 'Secondary Goal',
      'description': 'The secondary goal is to only deliver accurate information to the user.',
      'status': 'active'
    }
  },
  redis: {
    name: 'novo',
    host: process.env.REDIS_HOST || '127.0.0.1',
    username: 'default',
    password: process.env.REDIS_CRED || null,
    port: 6379,
    hosts: [
      'redis://default:5IX80CXcIAMJoSwwe1CXaMEiPWaKTx4F@redis-14560.c100.us-east-1-4.ec2.cloud.redislabs.com:14560'
    ]
  },
  http: {
    listen: true,
    hostname: 'localhost',
    interface: '0.0.0.0',
    port: 3040
  },
  email: {
    key: 'get from postmarkapp.com',
    enable: false,
    service: 'gmail',
    username: 'agent@trynovo.com',
    password: 'lobq mioh pimu usrr'
  },
  files: {
    corpus: '/media/storage/stores/sensemaker',
    path: '/media/storage/node/files',
    userstore: '/media/storage/uploads/users'
  },
  gemini: {
    model: 'gemini-pro',
    token: 'AIzaSyC2lGAZznayOAvs8dzAtqzpsS2rtcmruEk'
  },
  stripe: {
    token: {
      public: 'pk_test_51NLE0lHoVtrEXpIkwVlVukGcEwKXQz7qHqQ80FWg1YAPL1MmYl3HEifAcW1g4Frb70De1l7ENwh5aSPLnmF4Nl0y00A3AcE0bD',
      private: 'sk_test_51NLE0lHoVtrEXpIkP64o3ezEJgRolvx7R2c2zcijECKHwJ2NLT8GBNEoMDHLkEAJlNaA4o26aOU6n5JRNmxWRSSR00GVf6yvc8'
    }
  },
  interval: 600000, // 10 minutes (formerly 1 Hz)
  persistent: false,
  peers: [
    'localhost:7777'
  ],
  prompt: basePrompt.toString('utf8'),
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
    title: 'Novo &middot; Your Legal Assistant'
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
    // enable: true,
    jurisdictions: [
      'Arkansas',
      'California',
      'Colorado',
      'Florida',
      'NewJersey',
      'NewYork',
      'Ohio',
      'Pennsylvania',
      'Texas'
    ]
  },
  courtlistener: {
    enable: false,
    type: 'postgresql',
    host: 'localhost',
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
  linkedin: {
    enable: true,
    id: 'get from linkedin',
    secret: 'get from linkedin'
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
  ollama: {
    host: process.env.OLLAMA_HOST || '127.0.0.1',
    port: 11434,
    secure: false,
    model: 'llama3', // default model
    models: ['llama3'], // models to "prime" (preload)
    temperature: 0
  },
  pacer: {
    enable: true
  },
  openai: {
    enable: true,
    key: process.env.OPENAI_API_KEY || 'set to your own API key',
    model: 'gpt-4-turbo',
    temperature: 0
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
