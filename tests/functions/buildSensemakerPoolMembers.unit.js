'use strict';

const assert = require('assert');
const {
  buildSensemakerPoolMembers,
  buildOpenRouterPoolMember,
  buildHostedLlmPoolMember,
  isHostedProviderEnabled
} = require('../../functions/buildSensemakerPoolMembers');
const { HOSTED_LLM_PROVIDERS } = require('../../functions/hostedLlmProviders');

function withEnv (overrides, fn) {
  const saved = {};
  for (const key of Object.keys(overrides)) {
    saved[key] = process.env[key];
    if (overrides[key] === undefined) delete process.env[key];
    else process.env[key] = overrides[key];
  }
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      for (const key of Object.keys(overrides)) {
        if (saved[key] === undefined) delete process.env[key];
        else process.env[key] = saved[key];
      }
    });
}

function baseSettings (overrides = {}) {
  return Object.assign({
    ollama: {
      host: '127.0.0.1',
      port: 11434,
      model: 'qwen3:0.6b',
      secure: false
    },
    pool: {
      members: [{ host: '127.0.0.1', port: 11434, model: 'qwen3:0.6b' }]
    }
  }, overrides);
}

describe('buildSensemakerPoolMembers hosted providers', function () {
  const timeout = 120000;

  it('keeps local Ollama members when no hosted provider is enabled', async function () {
    const env = {};
    for (const provider of HOSTED_LLM_PROVIDERS) {
      env[provider.envForce] = undefined;
      for (const tokenName of provider.envTokens) env[tokenName] = undefined;
    }
    await withEnv(env, () => {
      const members = buildSensemakerPoolMembers(baseSettings(), timeout);
      assert.strictEqual(members.length, 1);
      assert.strictEqual(members[0].host, '127.0.0.1');
      assert.ok(!members.some((m) => m.host === 'openrouter.ai'));
      assert.ok(!members.some((m) => m.host === 'api.groq.com'));
    });
  });

  it('adds OpenRouter after locals when enabled with a token', function () {
    const settings = baseSettings({
      openrouter: {
        poolEnabled: true,
        token: 'or-test',
        poolModel: 'openai/gpt-4o-mini',
        appTitle: 'Sensemaker'
      }
    });
    const members = buildSensemakerPoolMembers(settings, timeout);
    const or = members.find((m) => m.host === 'openrouter.ai');
    assert.ok(or);
    assert.strictEqual(or.path, '/api/v1');
    assert.strictEqual(or.poolUpstreamModel, 'openai/gpt-4o-mini');
    assert.ok(or.additionalPoolModels.includes('qwen3:0.6b'));
    assert.ok(or.headers.Authorization.startsWith('Bearer or-test'));
    assert.strictEqual(or.headers['X-Title'], 'Sensemaker');
  });

  it('buildOpenRouterPoolMember still returns a member for the existing helper', function () {
    const member = buildOpenRouterPoolMember(baseSettings({
      openrouter: { token: 'or-test', poolModel: 'openai/gpt-4o-mini' }
    }), timeout);
    assert.ok(member);
    assert.strictEqual(member.name, 'OPENROUTER');
  });

  it('adds Groq when enabled with a token', function () {
    const settings = baseSettings({
      groq: { poolEnabled: true, token: 'gsk-test', poolModel: 'llama-3.1-8b-instant' }
    });
    const members = buildSensemakerPoolMembers(settings, timeout);
    const groq = members.find((m) => m.host === 'api.groq.com');
    assert.ok(groq);
    assert.strictEqual(groq.path, '/openai/v1');
    assert.strictEqual(groq.poolUpstreamModel, 'llama-3.1-8b-instant');
  });

  it('skips token-required providers that have no key', async function () {
    await withEnv({ GROQ_API_KEY: undefined, SENSEMAKER_GROQ_POOL: undefined }, () => {
      const settings = baseSettings({
        groq: { poolEnabled: true, token: '' }
      });
      const members = buildSensemakerPoolMembers(settings, timeout);
      assert.ok(!members.some((m) => m.host === 'api.groq.com'));
    });
  });

  it('adds OVH without a token because the anonymous tier needs none', function () {
    const settings = baseSettings({
      ovh: { poolEnabled: true }
    });
    const members = buildSensemakerPoolMembers(settings, timeout);
    const ovh = members.find((m) => m.host === 'oai.endpoints.kepler.ai.cloud.ovh.net');
    assert.ok(ovh);
    assert.strictEqual(ovh.headers.Authorization, undefined);
    assert.strictEqual(ovh.path, '/v1');
  });

  it('honors env force flags without a DB toggle', async function () {
    await withEnv({ SENSEMAKER_GROQ_POOL: '1', GROQ_API_KEY: 'gsk-env' }, () => {
      const groq = HOSTED_LLM_PROVIDERS.find((p) => p.id === 'groq');
      assert.strictEqual(isHostedProviderEnabled(groq, baseSettings()), true);
      const members = buildSensemakerPoolMembers(baseSettings(), timeout);
      assert.ok(members.some((m) => m.host === 'api.groq.com'));
    });
  });

  it('builds Gemini against the OpenAI-compat path', function () {
    const gemini = HOSTED_LLM_PROVIDERS.find((p) => p.id === 'gemini');
    const member = buildHostedLlmPoolMember(gemini, {
      gemini: { token: 'ai-studio', poolModel: 'gemini-2.5-flash' }
    }, timeout);
    assert.strictEqual(member.host, 'generativelanguage.googleapis.com');
    assert.strictEqual(member.path, '/v1beta/openai');
  });
});
