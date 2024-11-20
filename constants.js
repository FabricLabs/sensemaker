'use strict';

// Constants
const RELEASE_NAME = '1.0.0-RC1';
const RELEASE_DESCRIPTION = 'Exclusive access!';
const MAX_RESPONSE_TIME_MS = 600000;

// Fabric
const GENESIS_HASH = '';
const MAX_MEMORY_SIZE = 32 * 1024 * 1024; // 32 MB
const SNAPSHOT_INTERVAL = 1000 * 60 * 10; // 10 minutes
const {
  BITCOIN_NETWORK,
  FIXTURE_SEED
} = require('@fabric/core/constants');

// Sensemaker
const AGENT_MAX_TOKENS = 8192;
const AGENT_TEMPERATURE = 0.5;
const BRAND_NAME = 'Sensemaker';
const ENABLE_LOGIN = true;
const ENABLE_REGISTRATION = false;
const EMBEDDING_MODEL = 'mxbai-embed-large';

// Features
const ALLOWED_UPLOAD_TYPES = [
  'image/png',
  'image/jpeg',
  'image/tiff',
  'image/bmp',
  'application/pdf',
];

const BCRYPT_PASSWORD_ROUNDS = 10;

const ENABLE_CHANGELOG = true; // TODO: enable changelog ("blog")
const ENABLE_CONTENT_TOPBAR = true;
const ENABLE_CONVERSATION_SIDEBAR = false;
const ENABLE_BILLING = false; // TODO: enable billing
const ENABLE_CONTRACTS = true;
const ENABLE_DISCORD_LOGIN = false;
const ENABLE_DOCUMENTS = true;
const ENABLE_FEEDBACK_BUTTON = false;
const ENABLE_FILES = true;
const ENABLE_UPLOADS = false;
const ENABLE_DOCUMENT_SEARCH = true;
const ENABLE_PERSON_SEARCH = false;
const ENABLE_LIBRARY = true;
const ENABLE_CHAT = true;
const ENABLE_SOURCES = true;
const ENABLE_TASKS = true;
const USER_QUERY_TIMEOUT_MS = 15000; // 15 seconds
const USER_MENU_HOVER_TIME_MS = 1000;
const USER_HINT_TIME_MS = 3000;
const SYNC_EMBEDDINGS_COUNT = 100;
const INTEGRITY_CHECK = false;

// Browser
const BROWSER_DATABASE_NAME = 'sensemaker';
const BROWSER_DATABASE_TOKEN_TABLE = 'tokens';

// Records
const PER_PAGE_LIMIT = 100;
const PER_PAGE_DEFAULT = 30;

// ChatGPT
const CHATGPT_MAX_TOKENS = AGENT_MAX_TOKENS;
const OPENAI_API_KEY = 'replace with a valid OpenAI key';

// Exports
module.exports = {
  GENESIS_HASH, // TODO: use a real genesis hash
  RELEASE_NAME, // TODO: use a real release name
  RELEASE_DESCRIPTION, // TODO: use a real release description
  SNAPSHOT_INTERVAL, // 10 minutes for snapshot interval
  MAX_RESPONSE_TIME_MS, // 60 seconds for maximum response time
  BITCOIN_NETWORK, // Use mainnet for production
  FIXTURE_SEED, // Use a fixture seed for development
  AGENT_MAX_TOKENS,
  MAX_MEMORY_SIZE,
  INTEGRITY_CHECK,
  ALLOWED_UPLOAD_TYPES,
  BCRYPT_PASSWORD_ROUNDS,
  EMBEDDING_MODEL,
  ENABLE_CONTENT_TOPBAR,
  ENABLE_CONTRACTS,
  ENABLE_CHANGELOG,
  ENABLE_CONVERSATION_SIDEBAR,
  ENABLE_DISCORD_LOGIN,
  ENABLE_DOCUMENTS,
  ENABLE_FEEDBACK_BUTTON,
  ENABLE_BILLING,
  ENABLE_LOGIN,
  ENABLE_REGISTRATION,
  ENABLE_CHAT,
  ENABLE_FILES,
  ENABLE_DOCUMENT_SEARCH,
  ENABLE_PERSON_SEARCH,
  ENABLE_UPLOADS,
  ENABLE_LIBRARY,
  ENABLE_SOURCES,
  ENABLE_TASKS,
  PER_PAGE_LIMIT,
  PER_PAGE_DEFAULT,
  BROWSER_DATABASE_NAME,
  BROWSER_DATABASE_TOKEN_TABLE,
  BRAND_NAME,
  CHATGPT_MAX_TOKENS,
  OPENAI_API_KEY,
  AGENT_TEMPERATURE,
  USER_QUERY_TIMEOUT_MS,
  USER_HINT_TIME_MS,
  USER_MENU_HOVER_TIME_MS,
  SYNC_EMBEDDINGS_COUNT
};
