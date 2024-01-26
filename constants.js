'use strict';

// Constants
const RELEASE_NAME = 'beta-1.0.0-pre';
const RELEASE_DESCRIPTION = 'Exclusive access!';
const MAX_RESPONSE_TIME_MS = 60000; // 60 seconds

// Fabric
const GENESIS_HASH = '';
const MAX_MEMORY_SIZE = 32 * 1024 * 1024; // 32 MB
const {
  BITCOIN_NETWORK,
  FIXTURE_SEED
} = require('@fabric/core/constants');

// Sensemaker
const AGENT_MAX_TOKENS = 4096;
const AGENT_TEMPERATURE = 0.5;
const ENABLE_LOGIN = true;
const ENABLE_REGISTRATION = true;

// Jeeves
const BRAND_NAME = 'Novo';
const ENABLE_CASE_SEARCH = false;
const ENABLE_COURT_SEARCH = false;
const ENABLE_JUDGE_SEARCH = false;
const ENABLE_OPINION_SEARCH = false;
const ENABLE_DOCUMENT_SEARCH = false;
const ENABLE_PERSON_SEARCH = false;
const ENABLE_JURISDICTION_SEARCH = false;
const ENABLE_REPORTER_SEARCH = false;
const ENABLE_STATUTE_SEARCH = false;
const ENABLE_VOLUME_SEARCH = false;
const ENABLE_LIBRARY = false;
const ENABLE_CHAT = true;
const SEARCH_CASES_MAX_WORDS = 20;
const USER_QUERY_TIMEOUT_MS = 15000; // 15 seconds
const INTEGRITY_CHECK = false;

// Browser
const BROWSER_DATABASE_NAME = 'jeeves';
const BROWSER_DATABASE_TOKEN_TABLE = 'tokens';

// Records
const PER_PAGE_LIMIT = 100;
const PER_PAGE_DEFAULT = 30;

// ChatGPT
const CHATGPT_MAX_TOKENS = AGENT_MAX_TOKENS;

// Exports
module.exports = {
  GENESIS_HASH, // TODO: use a real genesis hash
  RELEASE_NAME, // TODO: use a real release name
  RELEASE_DESCRIPTION, // TODO: use a real release description
  MAX_RESPONSE_TIME_MS, // 60 seconds for maximum response time
  BITCOIN_NETWORK, // Use mainnet for production
  FIXTURE_SEED, // Use a fixture seed for development
  AGENT_MAX_TOKENS,
  MAX_MEMORY_SIZE,
  INTEGRITY_CHECK,
  ENABLE_LOGIN,
  ENABLE_REGISTRATION,
  ENABLE_CHAT,
  ENABLE_CASE_SEARCH,
  ENABLE_COURT_SEARCH,
  ENABLE_JUDGE_SEARCH,
  ENABLE_OPINION_SEARCH,
  ENABLE_DOCUMENT_SEARCH,
  ENABLE_PERSON_SEARCH,
  ENABLE_JURISDICTION_SEARCH,
  ENABLE_REPORTER_SEARCH,
  ENABLE_STATUTE_SEARCH,
  ENABLE_VOLUME_SEARCH,
  ENABLE_LIBRARY,
  PER_PAGE_LIMIT,
  PER_PAGE_DEFAULT,
  SEARCH_CASES_MAX_WORDS,
  BROWSER_DATABASE_NAME,
  BROWSER_DATABASE_TOKEN_TABLE,
  BRAND_NAME,
  CHATGPT_MAX_TOKENS,
  AGENT_TEMPERATURE,
  USER_QUERY_TIMEOUT_MS
};
