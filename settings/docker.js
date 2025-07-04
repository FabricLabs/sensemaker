/**
 * Docker-specific settings for Sensemaker
 * These settings override the local settings for containerized deployments
 */
'use strict';

const merge = require('lodash.merge');
const localSettings = require('./local');

// Docker-specific overrides
const dockerSettings = {
  db: {
    type: 'mysql',
    host: process.env.SQL_DB_HOST || 'mysql',
    port: 3306,
    user: process.env.SQL_DB_USERNAME || 'db_user_sensemaker',
    password: process.env.SQL_DB_PASSWORD || 'sensemaker_password',
    database: 'db_sensemaker'
  },
  redis: {
    name: 'sensemaker',
    host: process.env.REDIS_HOST || 'redis',
    username: 'default',
    password: process.env.REDIS_CRED || null,
    port: 6379
  },
  ollama: {
    host: process.env.OLLAMA_HOST || 'ollama',
    port: process.env.OLLAMA_PORT || 11434,
    secure: false,
    model: 'llama3.2:1b', // Use a smaller model for Docker
    models: ['llama3.2:1b', 'qwen2.5:0.5b'], // Smaller models for containers
    temperature: 0,
    preload: true
  },
  http: {
    listen: true,
    hostname: 'localhost',
    interface: '0.0.0.0',
    port: 3040
  },
  // Disable some features that may not be needed in Docker
  discord: {
    enable: false
  },
  embeddings: {
    enable: false
  },
  trainer: {
    enable: false
  },
  // Simplify services for Docker deployment
  services: [
    'github'
  ],
  // Reduce resource usage
  workers: 4,
  interval: 300000, // 5 minutes
  
  // Use container-friendly paths
  files: {
    corpus: '/media/storage/stores/sensemaker',
    path: '/media/storage/node/files',
    userstore: '/media/storage/uploads/users'
  }
};

// Merge with local settings
module.exports = merge({}, localSettings, dockerSettings);