'use strict';

// Constants
const NAME = 'NOVO';
const VERSION = '1.0.0-RC2';
const {
  FIXTURE_SEED
} = require('@fabric/core/constants');

// Hosts
const ALPHA = '10.8.0.50';
const HIVEMIND = 'balrog'; // must be in /etc/hosts or otherise provided by local DNS
const SOCRATES = 'socrates'; // must be in /etc/hosts or otherise provided by local DNS
const YMIR = '10.8.0.3';
const ODIN = '10.8.0.4';
const THOR = '10.8.0.5';
const TANGO = '10.8.0.30';
const MANGO = '10.8.0.32';
const FOXTROT = '10.8.0.31';
const CLARITY = '10.8.0.34';
const BALROG = '10.8.0.33';
const GOTHMOG = '10.8.0.60';

// Dependencies
const fs = require('fs');
const path = require('path');
const merge = require('lodash.merge');

// Fabric Types
const Environment = require('@fabric/core/types/environment');
const environment = new Environment();

// Start Fabric environment
// TODO: is this necessary if we aren't loading the wallet?
environment.start();

// TODO: @chrisinajar
// PROJECT: @fabric/http
// Determine output of various inputs.
// Output should be deterministic, HTML-encoded applications.

// Prompts
const alphaTxtPath = path.join(__dirname, '../prompts/alpha.txt');
const betaTxtPath = path.join(__dirname, '../prompts/novo.txt');
const novoTxtPath = path.join(__dirname, '../prompts/novo.txt');
const alphaPrompt = fs.readFileSync(alphaTxtPath, 'utf8');
const betaPrompt = fs.readFileSync(betaTxtPath, 'utf8');
const novoPrompt = fs.readFileSync(novoTxtPath, 'utf8');

// Configurations
const network = require('./network');

/**
 * Provides the user's local settings.
 */
module.exports = {
  alias: NAME,
  benchmark: false,
  domain: 'trynovo.com', // TODO: implement network-wide document search, use `novo` as canonical domain
  moniker: NAME,
  release: 'beta',
  name: 'Novo',
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
  agents: merge({}, network, {
    /* local: {
      name: 'MAINSTAY',
      prompt: novoPrompt.toString('utf8'),
      model: 'llama3',
      host: '127.0.0.1',
      port: 11434,
      secure: false,
      temperature: 0
    } */
  }),
  pipeline: {
    enable: false,
    consensus: ['socrates']
  },
  fabric: {
    peers: ['hub.fabric.pub:7777', 'beta.jeeves.dev:7777', 'trynovo.com:7777'],
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
    host: process.env.JEEVES_DB_HOST || '127.0.0.1',
    port: 3306,
    user: 'db_user_jeeves',
    password: 'chahcieYishi1wuu',
    database: 'db_jeeves'
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
    host: '127.0.0.1',
    username: 'default',
    password: null,
    port: 6379,
    hosts: [
      'redis://default@localhost:6379',
      'redis://default:5IX80CXcIAMJoSwwe1CXaMEiPWaKTx4F@redis-14560.c100.us-east-1-4.ec2.cloud.redislabs.com:14560'
    ]
  },
  http: {
    listen: true,
    hostname: 'localhost',
    interface: '0.0.0.0',
    port: 3045
  },
  email: {
    key: 'get from postmarkapp.com',
    enable: false,
    service: 'gmail',
    username: 'agent@trynovo.com',
    password: 'generate app-specific password'
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
  prompt: betaPrompt.toString('utf8'),
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
    host: '127.0.0.1',
    port: 11434,
    secure: false,
    model: 'llama3', // default model
    models: ['llama3'] // models to "prime" (preload)
  },
  pacer: {
    enable: true
  },
  openai: {
    enable: true,
    key: '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',
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
