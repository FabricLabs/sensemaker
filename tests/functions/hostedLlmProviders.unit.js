'use strict';

const assert = require('assert');
const {
  HOSTED_LLM_PROVIDERS,
  HOSTED_LLM_POOL_SETTING_NAMES,
  OPENROUTER_POOL_SETTING_NAME,
  hostedLlmProviderBySettingName,
  defaultHostedLlmSettings
} = require('../../functions/hostedLlmProviders');

describe('hostedLlmProviders', function () {
  it('includes OpenRouter with the existing global setting name', function () {
    assert.ok(HOSTED_LLM_PROVIDERS.length >= 8);
    assert.strictEqual(OPENROUTER_POOL_SETTING_NAME, 'OPENROUTER_POOL_ENABLED');
    assert.ok(HOSTED_LLM_POOL_SETTING_NAMES.includes(OPENROUTER_POOL_SETTING_NAME));
    const openrouter = hostedLlmProviderBySettingName(OPENROUTER_POOL_SETTING_NAME);
    assert.ok(openrouter);
    assert.strictEqual(openrouter.host, 'openrouter.ai');
    assert.strictEqual(openrouter.path, '/api/v1');
  });

  it('uses OpenAI-compatible HTTPS endpoints', function () {
    for (const provider of HOSTED_LLM_PROVIDERS) {
      assert.strictEqual(provider.secure, true);
      assert.strictEqual(provider.port, 443);
      assert.ok(provider.path.startsWith('/'));
      assert.ok(!provider.path.endsWith('/chat/completions'));
      assert.ok(provider.settingName.endsWith('_POOL_ENABLED'));
    }
  });

  it('marks OVH and LLM7 as usable without a key', function () {
    const ovh = HOSTED_LLM_PROVIDERS.find((p) => p.id === 'ovh');
    const llm7 = HOSTED_LLM_PROVIDERS.find((p) => p.id === 'llm7');
    assert.strictEqual(ovh.tokenRequired, false);
    assert.strictEqual(llm7.tokenRequired, false);
    const groq = HOSTED_LLM_PROVIDERS.find((p) => p.id === 'groq');
    assert.strictEqual(groq.tokenRequired, true);
  });

  it('builds default settings bags from env tokens', function () {
    const prev = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'gsk-unit-test';
    try {
      const bags = defaultHostedLlmSettings();
      assert.strictEqual(bags.groq.token, 'gsk-unit-test');
      assert.strictEqual(bags.groq.poolEnabled, false);
      assert.ok(bags.openrouter);
      assert.strictEqual(typeof bags.openrouter.appTitle, 'string');
    } finally {
      if (prev === undefined) delete process.env.GROQ_API_KEY;
      else process.env.GROQ_API_KEY = prev;
    }
  });
});
