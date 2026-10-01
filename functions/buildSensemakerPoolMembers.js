'use strict';

const merge = require('lodash.merge');
const dedupeOllamaPoolMembers = require('./dedupeOllamaPoolMembers');
const { HOSTED_LLM_PROVIDERS } = require('./hostedLlmProviders');

function collectPoolAliasModels (settings) {
  const models = new Set();
  if (settings.ollama && settings.ollama.model) models.add(settings.ollama.model);
  const parallel = settings.pipeline && settings.pipeline.parallelModels;
  if (Array.isArray(parallel)) {
    parallel.forEach((m) => models.add(m));
  }
  return [...models];
}

function resolveProviderToken (provider, settings) {
  for (const envName of provider.envTokens) {
    if (process.env[envName] && String(process.env[envName]).trim()) {
      return String(process.env[envName]).trim();
    }
  }
  const bag = settings[provider.settingsKey] || {};
  if (bag.token && String(bag.token).trim()) return String(bag.token).trim();
  return '';
}

function isHostedProviderEnabled (provider, settings) {
  if (process.env[provider.envForce] === '1') return true;
  const bag = settings[provider.settingsKey] || {};
  return !!bag.poolEnabled;
}

function buildHostedHeaders (provider, settings, token) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (provider.id === 'openrouter') {
    const bag = settings.openrouter || {};
    const referer = bag.httpReferer || process.env.OPENROUTER_HTTP_REFERER;
    if (referer) headers['HTTP-Referer'] = referer;
    headers['X-Title'] = bag.appTitle || 'Sensemaker';
  }
  return headers;
}

/**
 * Build one OpenAI-compatible pool member from a catalog row.
 * @returns {object|null}
 */
function buildHostedLlmPoolMember (provider, settings, defaultLlmTimeoutMs) {
  const token = resolveProviderToken(provider, settings);
  if (provider.tokenRequired !== false && !token) return null;

  const bag = settings[provider.settingsKey] || {};
  const poolModel = bag.poolModel
    || process.env[provider.envModel]
    || provider.defaultModel;

  return {
    name: provider.name,
    host: provider.host,
    port: provider.port,
    secure: provider.secure,
    path: provider.path,
    headers: buildHostedHeaders(provider, settings, token),
    model: poolModel,
    poolUpstreamModel: poolModel,
    additionalPoolModels: collectPoolAliasModels(settings),
    timeout: { tolerance: defaultLlmTimeoutMs }
  };
}

/**
 * Build optional OpenRouter pool member (OpenAI-compatible API).
 * @returns {object|null}
 */
function buildOpenRouterPoolMember (settings, defaultLlmTimeoutMs) {
  const provider = HOSTED_LLM_PROVIDERS.find((row) => row.id === 'openrouter');
  return buildHostedLlmPoolMember(provider, settings, defaultLlmTimeoutMs);
}

/**
 * @param {object} settings - merged Sensemaker settings (incl. hosted *.poolEnabled after DB hydrate).
 * @param {number} defaultLlmTimeoutMs
 * @returns {object[]}
 */
function buildSensemakerPoolMembers (settings, defaultLlmTimeoutMs) {
  const timeoutWrap = { tolerance: defaultLlmTimeoutMs };
  const poolMembersRaw = (Array.isArray(settings.pool && settings.pool.members) && settings.pool.members.length > 0)
    ? settings.pool.members.map((m) => merge({}, settings.ollama, m, { timeout: timeoutWrap }))
    : [
      merge({}, settings.ollama, { timeout: timeoutWrap }),
      merge({}, settings.ollama, { name: 'MARTINDALE', host: '192.168.50.5', model: 'llama3.2', timeout: timeoutWrap })
    ];

  const locals = dedupeOllamaPoolMembers(poolMembersRaw);
  const out = locals.map((m) => merge({}, m, { timeout: merge({}, timeoutWrap, m.timeout || {}) }));

  for (const provider of HOSTED_LLM_PROVIDERS) {
    if (!isHostedProviderEnabled(provider, settings)) continue;
    const member = buildHostedLlmPoolMember(provider, settings, defaultLlmTimeoutMs);
    if (member) out.push(member);
  }

  return out;
}

module.exports = {
  buildSensemakerPoolMembers,
  buildOpenRouterPoolMember,
  buildHostedLlmPoolMember,
  collectPoolAliasModels,
  isHostedProviderEnabled,
  resolveProviderToken
};
