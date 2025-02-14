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

const {
  CORE_MODEL,
  EMBEDDING_MODEL
} = require('../constants');

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
  authority: 'sensemaker.io',
  benchmark: false,
  domain: 'sensemaker.io', // TODO: implement network-wide document search
  moniker: NAME,
  release: 'beta',
  name: 'Sensemaker',
  mode: 'production',
  expander: true,
  crawl: true,
  debug: false, // environment.readVariable('DEBUG') || false,
  seed:  environment.readVariable('FABRIC_SEED') || FIXTURE_SEED,
  temperature: 0,
  constraints: {
    tokens: {
      max: 65536 // can be doubled to ~131072
    }
  },
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
      model: CORE_MODEL,
      host: '127.0.0.1',
      port: 11434,
      secure: false,
      temperature: 0
    }
  }, network, {}),
  pipeline: {
    enable: false,
    consensus: ['local']
  },
  fabric: {
    enable: true,
    listen: false,
    peers: ['hub.fabric.pub:7777', 'hub.sensemaker.io:7777', 'beta.jeeves.dev:7777'],
    port: 7777,
    remotes: [
      { host: 'sensemaker.io', port: 443, secure: true, collections: ['documents'] },
      { host: 'hub.fabric.pub', port: 443, secure: true, collections: ['documents'] },
      { host: 'beta.jeeves.dev', port: 443, secure: true, collections: ['documents'] }
    ],
    search: true,
    sync: false
  },
  db: {
    type: 'mysql',
    host: process.env.SQL_DB_HOST || '127.0.0.1',
    port: 3306,
    user: 'your_sql_user',
    password: process.env.SQL_DB_CRED || 'your sql password',
    database: 'db_sensemaker'
  },
  discord: {
    enable: false,
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
    name: 'sensemaker',
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
    username: 'sensemaker@localhost',
    password: 'application-specific-password'
  },
  files: {
    corpus: '/media/storage/stores/sensemaker',
    path: '/media/storage/node/files',
    userstore: '/media/storage/uploads/users'
  },
  gemini: {
    model: 'gemini-pro',
    token: 'get from gemini'
  },
  stripe: {
    token: {
      public: 'get from stripe',
      private: 'get from stripe'
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
    'github',
    'matrix',
    'twilio'
  ],
  site: {
    title: 'sensemaker &middot; digital intelligence',
  },
  triggers: {
    'chief2ieshu2ig1kohquahngooQuoob3': {
      method: '_notifyHoneyPotMonitor'
    }
  },
  bitcoin: {
    enable: true,
    fullnode: false,
    network: 'mainnet',
    interval: 60000,
    nodes: [
      { name: 'BITCOIN_LOCAL_MAINNET_WALLET', network: 'mainnet', url: 'http://localhost:8332', roles: ['wallet', 'blockchain', 'mempool'] },
      { name: 'BITCOIN_LOCAL_MAINNET_BOUNDARY', network: 'mainnet', url: 'http://localhost:8332', roles: ['blockchain', 'mempool'] },
      { name: 'BITCOIN_LOCAL_TESTNET_WALLET', network: 'testnet', url: 'http://localhost:18332', roles: ['wallet', 'blockchain', 'mempool'] },
      { name: 'BITCOIN_LOCAL_TESTNET_BOUNDARY', network: 'testnet', url: 'http://localhost:18332', roles: ['blockchain', 'mempool'] },
      { name: 'BITCOIN_LOCAL_REGTEST_WALLET', network: 'regtest', url: 'http://localhost:18443', roles: ['wallet', 'blockchain', 'mempool'] },
      { name: 'BITCOIN_LOCAL_REGTEST_BOUNDARY', network: 'regtest', url: 'http://localhost:18443', roles: ['blockchain', 'mempool'] }
    ],
    constraints: {
      storage: {
        size: 550 // size in MB
      }
    }
  },
  github: {
    interval: 10000,
    targets: [
      'bitcoin/bitcoin',
      'FabricLabs/fabric'
    ],
    token: null
  },
  google: {
    ai: {
      token: 'get from google'
    }
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
    name: '@sensemaker/core',
    handle: '@sensemaker:fabric.pub',
    connect: true,
    constraints: {
      sync: {
        limit: 20
      }
    },
    homeserver: 'https://fabric.pub',
    coordinator: '!CcnochnehZgASDIexN:fabric.pub',
    token: 'get from matrix'
  },
  ollama: {
    host: process.env.OLLAMA_HOST || '127.0.0.1',
    port: 11434,
    secure: false,
    model: CORE_MODEL, // default model
    models: [CORE_MODEL, 'llama3.2-vision'], // models to "prime" (preload)
    temperature: 0
  },
  openai: {
    enable: true,
    key: process.env.OPENAI_API_KEY || 'set to your own API key',
    model: 'gpt-4-turbo',
    temperature: 0
  },
  rsi: {
    http: {
      enable: false
    }
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
