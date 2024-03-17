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
const VERSION = '1.0.0-RC1';
const {
  FIXTURE_SEED
} = require('@fabric/core/constants');

const path = require('path');
const alphaTxtPath = path.join(__dirname, '../prompts/alpha.txt');
const betaTxtPath = path.join(__dirname, '../prompts/novo.txt');
const novoTxtPath = path.join(__dirname, '../prompts/novo.txt');
const alphaPrompt = fs.readFileSync(alphaTxtPath, 'utf8');
const betaPrompt = fs.readFileSync(betaTxtPath, 'utf8');
const novoPrompt = fs.readFileSync(novoTxtPath, 'utf8');

/**
 * Provides the user's local settings.
 */
module.exports = {
  alias: NAME,
  benchmark: false,
  domain: 'trynovo.com',
  moniker: NAME,
  release: 'beta',
  name: 'Novo',
  mode: 'production',
  crawl: false,
  debug: false, // environment.readVariable('DEBUG') || false,
  seed:  environment.readVariable('FABRIC_SEED') || FIXTURE_SEED,
  workers: 8,
  agents: {
    alpha: {
      prompt: alphaPrompt.toString('utf8'),
      model: 'llama2',
      host: 'jeeves.dev',
      port: 11434,
      secure: false
    },
    beta: {
      prompt: betaPrompt.toString('utf8'),
      model: 'llama2',
      host: 'ollama.jeeves.dev',
      port: 11434,
      secure: false
    },
    gamma: {
      prompt: betaPrompt.toString('utf8'),
      model: 'llama2',
      host: 'gamma.trynovo.com',
      port: 443,
      secure: true
    },
    delta: {
      prompt: betaPrompt.toString('utf8'),
      model: 'llama2',
      host: 'delta.trynovo.com',
      port: 443,
      secure: true
    }
  },
  fabric: {
    peers: ['hub.fabric.pub:7777', 'beta.jeeves.dev:7777', 'trynovo.com:7777'],
    listen: false,
    remotes: [
      { host: 'hub.fabric.pub', port: 443, secure: true },
      { host: 'beta.jeeves.dev', port: 443, secure: true, collections: ['documents', 'courts'] },
      { host: 'gamma.trynovo.com', port: 443, secure: true, collections: ['documents', 'courts'] },
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
  redis: {
    username: 'default',
    host: 'localhost',
    password: null,
    port: 6379,
    hosts: [
      'redis://default:2C8WdRfdktdE5MLLPkWAJptoxo9vBBYL@redis-14310.c311.eu-central-1-1.ec2.cloud.redislabs.com:14310'
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
    corpus: '/Users/eric/jeeves.dev/stores/sensemaker',
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
  interval: 1000, // 1 Hz
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
    enable: false,
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
  mysql: {
    host: 'localhost',
    port: 3306,
    username: 'dbuser_jeeves_dev',
    password: ''
  },
  ollama: {
    host: 'ollama.trynovo.com',
    secure: true,
    models: ['llama2', 'mistral', 'mixtral', 'gemma']
  },
  pacer: {
    enable: true
  },
  openai: {
    enable: true,
    key: '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',
    model: 'gpt-4-1106-preview',
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
