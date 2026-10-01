'use strict';

/**
 * Optional OpenAI-compatible hosted LLM backends for the Sensemaker pool.
 * Each row is off by default and enabled from Admin → Services (or env force).
 * Catalog is browser-safe (no secrets). Token resolution happens in
 * {@link module:functions/buildSensemakerPoolMembers}.
 */

const OPENROUTER_POOL_SETTING_NAME = 'OPENROUTER_POOL_ENABLED';

/**
 * @typedef {Object} HostedLlmProvider
 * @property {string} id
 * @property {string} name Pool member name
 * @property {string} label Admin table label
 * @property {string} description Admin help text
 * @property {string} settingName Global settings row (boolean)
 * @property {string} settingsKey settings/local.js bag key
 * @property {string} envForce When set to "1", force-enable this member
 * @property {string[]} envTokens Process env names checked for an API key
 * @property {string} envModel Process env override for the upstream model id
 * @property {string} host
 * @property {number} port
 * @property {boolean} secure
 * @property {string} path OpenAI-compatible base path (Agent appends /chat/completions)
 * @property {string} defaultModel
 * @property {boolean} tokenRequired When false, the member can join with no key
 * @property {string} docsUrl
 */

/** @type {HostedLlmProvider[]} */
const HOSTED_LLM_PROVIDERS = Object.freeze([
  Object.freeze({
    id: 'openrouter',
    name: 'OPENROUTER',
    label: 'OpenRouter',
    description: 'Aggregator with :free models. Requires OPENROUTER_API_KEY. Tried after local Ollama.',
    settingName: OPENROUTER_POOL_SETTING_NAME,
    settingsKey: 'openrouter',
    envForce: 'SENSEMAKER_OPENROUTER_POOL',
    envTokens: Object.freeze(['OPENROUTER_API_KEY']),
    envModel: 'OPENROUTER_POOL_MODEL',
    host: 'openrouter.ai',
    port: 443,
    secure: true,
    path: '/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    tokenRequired: true,
    docsUrl: 'https://openrouter.ai/keys'
  }),
  Object.freeze({
    id: 'groq',
    name: 'GROQ',
    label: 'Groq',
    description: 'Free-tier LPU inference. Requires GROQ_API_KEY.',
    settingName: 'GROQ_POOL_ENABLED',
    settingsKey: 'groq',
    envForce: 'SENSEMAKER_GROQ_POOL',
    envTokens: Object.freeze(['GROQ_API_KEY']),
    envModel: 'GROQ_POOL_MODEL',
    host: 'api.groq.com',
    port: 443,
    secure: true,
    path: '/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    tokenRequired: true,
    docsUrl: 'https://console.groq.com/keys'
  }),
  Object.freeze({
    id: 'gemini',
    name: 'GEMINI',
    label: 'Google Gemini',
    description: 'AI Studio free tier via the OpenAI-compatible endpoint. Requires GEMINI_API_KEY or GOOGLE_API_KEY.',
    settingName: 'GEMINI_POOL_ENABLED',
    settingsKey: 'gemini',
    envForce: 'SENSEMAKER_GEMINI_POOL',
    envTokens: Object.freeze(['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY']),
    envModel: 'GEMINI_POOL_MODEL',
    host: 'generativelanguage.googleapis.com',
    port: 443,
    secure: true,
    path: '/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    tokenRequired: true,
    docsUrl: 'https://aistudio.google.com/app/apikey'
  }),
  Object.freeze({
    id: 'mistral',
    name: 'MISTRAL',
    label: 'Mistral',
    description: 'La Plateforme free mode. Requires MISTRAL_API_KEY.',
    settingName: 'MISTRAL_POOL_ENABLED',
    settingsKey: 'mistral',
    envForce: 'SENSEMAKER_MISTRAL_POOL',
    envTokens: Object.freeze(['MISTRAL_API_KEY']),
    envModel: 'MISTRAL_POOL_MODEL',
    host: 'api.mistral.ai',
    port: 443,
    secure: true,
    path: '/v1',
    defaultModel: 'mistral-small-latest',
    tokenRequired: true,
    docsUrl: 'https://console.mistral.ai/api-keys'
  }),
  Object.freeze({
    id: 'huggingface',
    name: 'HUGGINGFACE',
    label: 'Hugging Face',
    description: 'Inference Providers router (small monthly credit). Requires HF_TOKEN.',
    settingName: 'HUGGINGFACE_POOL_ENABLED',
    settingsKey: 'huggingface',
    envForce: 'SENSEMAKER_HUGGINGFACE_POOL',
    envTokens: Object.freeze(['HF_TOKEN', 'HUGGINGFACE_HUB_TOKEN', 'HUGGINGFACE_API_KEY']),
    envModel: 'HUGGINGFACE_POOL_MODEL',
    host: 'router.huggingface.co',
    port: 443,
    secure: true,
    path: '/v1',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    tokenRequired: true,
    docsUrl: 'https://huggingface.co/settings/tokens'
  }),
  Object.freeze({
    id: 'nvidia',
    name: 'NVIDIA',
    label: 'NVIDIA NIM',
    description: 'build.nvidia.com free developer inference. Requires NVIDIA_API_KEY.',
    settingName: 'NVIDIA_POOL_ENABLED',
    settingsKey: 'nvidia',
    envForce: 'SENSEMAKER_NVIDIA_POOL',
    envTokens: Object.freeze(['NVIDIA_API_KEY']),
    envModel: 'NVIDIA_POOL_MODEL',
    host: 'integrate.api.nvidia.com',
    port: 443,
    secure: true,
    path: '/v1',
    defaultModel: 'openai/gpt-oss-20b',
    tokenRequired: true,
    docsUrl: 'https://build.nvidia.com/settings/api-keys'
  }),
  Object.freeze({
    id: 'cerebras',
    name: 'CEREBRAS',
    label: 'Cerebras',
    description: 'Free-tier wafer-scale inference. Requires CEREBRAS_API_KEY.',
    settingName: 'CEREBRAS_POOL_ENABLED',
    settingsKey: 'cerebras',
    envForce: 'SENSEMAKER_CEREBRAS_POOL',
    envTokens: Object.freeze(['CEREBRAS_API_KEY']),
    envModel: 'CEREBRAS_POOL_MODEL',
    host: 'api.cerebras.ai',
    port: 443,
    secure: true,
    path: '/v1',
    defaultModel: 'llama3.1-8b',
    tokenRequired: true,
    docsUrl: 'https://cloud.cerebras.ai'
  }),
  Object.freeze({
    id: 'sambanova',
    name: 'SAMBANOVA',
    label: 'SambaNova',
    description: 'Free-tier RDU inference. Requires SAMBANOVA_API_KEY.',
    settingName: 'SAMBANOVA_POOL_ENABLED',
    settingsKey: 'sambanova',
    envForce: 'SENSEMAKER_SAMBANOVA_POOL',
    envTokens: Object.freeze(['SAMBANOVA_API_KEY']),
    envModel: 'SAMBANOVA_POOL_MODEL',
    host: 'api.sambanova.ai',
    port: 443,
    secure: true,
    path: '/v1',
    defaultModel: 'Meta-Llama-3.3-70B-Instruct',
    tokenRequired: true,
    docsUrl: 'https://cloud.sambanova.ai/apis'
  }),
  Object.freeze({
    id: 'ovh',
    name: 'OVH',
    label: 'OVHcloud AI Endpoints',
    description: 'EU-hosted open models. Anonymous free tier (no key); optional OVH_API_KEY for higher limits.',
    settingName: 'OVH_POOL_ENABLED',
    settingsKey: 'ovh',
    envForce: 'SENSEMAKER_OVH_POOL',
    envTokens: Object.freeze(['OVH_API_KEY', 'OVH_AI_ENDPOINTS_ACCESS_TOKEN']),
    envModel: 'OVH_POOL_MODEL',
    host: 'oai.endpoints.kepler.ai.cloud.ovh.net',
    port: 443,
    secure: true,
    path: '/v1',
    defaultModel: 'gpt-oss-20b',
    tokenRequired: false,
    docsUrl: 'https://www.ovhcloud.com/en/public-cloud/ai-endpoints/catalog/'
  }),
  Object.freeze({
    id: 'zai',
    name: 'ZAI',
    label: 'Z.AI (GLM Flash)',
    description: 'Permanent free GLM Flash models. Requires ZAI_API_KEY.',
    settingName: 'ZAI_POOL_ENABLED',
    settingsKey: 'zai',
    envForce: 'SENSEMAKER_ZAI_POOL',
    envTokens: Object.freeze(['ZAI_API_KEY', 'ZHIPU_API_KEY']),
    envModel: 'ZAI_POOL_MODEL',
    host: 'api.z.ai',
    port: 443,
    secure: true,
    path: '/api/paas/v4',
    defaultModel: 'glm-4.7-flash',
    tokenRequired: true,
    docsUrl: 'https://z.ai/manage-apikey/apikey-list'
  }),
  Object.freeze({
    id: 'llm7',
    name: 'LLM7',
    label: 'LLM7.io',
    description: 'Free gateway. Anonymous access on some models; optional LLM7_API_KEY unlocks the rest.',
    settingName: 'LLM7_POOL_ENABLED',
    settingsKey: 'llm7',
    envForce: 'SENSEMAKER_LLM7_POOL',
    envTokens: Object.freeze(['LLM7_API_KEY']),
    envModel: 'LLM7_POOL_MODEL',
    host: 'api.llm7.io',
    port: 443,
    secure: true,
    path: '/v1',
    defaultModel: 'gpt-oss:20b',
    tokenRequired: false,
    docsUrl: 'https://token.llm7.io'
  })
]);

const HOSTED_LLM_POOL_SETTING_NAMES = Object.freeze(
  HOSTED_LLM_PROVIDERS.map((provider) => provider.settingName)
);

function hostedLlmProviderBySettingName (settingName) {
  return HOSTED_LLM_PROVIDERS.find((provider) => provider.settingName === settingName) || null;
}

/**
 * Default settings/local.js bags for hosted providers (tokens from env only).
 * @returns {Object}
 */
function defaultHostedLlmSettings () {
  const out = {};
  for (const provider of HOSTED_LLM_PROVIDERS) {
    let token = '';
    for (const envName of provider.envTokens) {
      if (process.env[envName] && String(process.env[envName]).trim()) {
        token = String(process.env[envName]).trim();
        break;
      }
    }
    out[provider.settingsKey] = {
      poolEnabled: false,
      poolModel: process.env[provider.envModel] || provider.defaultModel,
      token
    };
  }
  if (out.openrouter) {
    out.openrouter.httpReferer = process.env.OPENROUTER_HTTP_REFERER || '';
    out.openrouter.appTitle = 'Sensemaker';
  }
  return out;
}

module.exports = {
  HOSTED_LLM_PROVIDERS,
  HOSTED_LLM_POOL_SETTING_NAMES,
  OPENROUTER_POOL_SETTING_NAME,
  hostedLlmProviderBySettingName,
  defaultHostedLlmSettings
};
