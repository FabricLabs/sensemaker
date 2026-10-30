'use strict';

const assert = require('assert');
const { buildNativeChatBody, heavyModelsExcept, isRunnerLoadEof, selectChatModel } = require('../../functions/ollamaNativeChat');

describe('ollama native chat', function () {
  it('recognizes a runner that died during model load', function () {
    const body = '{"error":{"message":"do load request: Post \\"http://127.0.0.1:33935/load\\": EOF","type":"api_error"}}';
    assert.strictEqual(isRunnerLoadEof(body), true);
    assert.strictEqual(isRunnerLoadEof('Ollama HTTP 500'), false);
  });

  it('asks with thinking off and a small context', function () {
    const payload = buildNativeChatBody('Summarize the open tasks.', {
      model: 'qwen3:0.6b',
      num_ctx: 4096,
      num_predict: 500
    });
    assert.strictEqual(payload.think, false);
    assert.strictEqual(payload.stream, false);
    assert.strictEqual(payload.options.num_ctx, 4096);
    assert.strictEqual(payload.options.num_predict, 500);
    assert.strictEqual(payload.messages[0].content, 'Summarize the open tasks.');
  });

  it('includes tools when provided and omits them when absent', function () {
    const tools = [{ type: 'function', function: { name: 'list_tasks' } }];
    const withTools = buildNativeChatBody('List my tasks.', { tools: tools });
    assert.deepStrictEqual(withTools.tools, tools);
    const without = buildNativeChatBody('List my tasks.', {});
    assert.strictEqual(without.tools, undefined);
    const messages = [
      { role: 'user', content: 'List my tasks.' },
      { role: 'assistant', content: '', tool_calls: [] },
      { role: 'tool', content: '[]', tool_call_id: 'call-0' }
    ];
    const continued = buildNativeChatBody('ignored', { messages: messages });
    assert.strictEqual(continued.messages.length, 3);
    assert.strictEqual(continued.messages[2].role, 'tool');
  });

  it('leaves the context window alone when reusing a loaded model', function () {
    const payload = buildNativeChatBody('ping', { model: 'llama3.2:latest', reuseLoaded: true });
    assert.strictEqual(payload.model, 'llama3.2:latest');
    assert.strictEqual(payload.options.num_ctx, undefined);
  });

  it('keeps the requested model even when a different one is loaded', function () {
    const loaded = [{ name: 'llama3.2:latest', size: 5769635840, context_length: 32768 }];
    assert.deepStrictEqual(selectChatModel('qwen3:0.6b', loaded), {
      model: 'qwen3:0.6b',
      reuse: false
    });
    assert.deepStrictEqual(selectChatModel('llama3.2:latest', loaded), {
      model: 'llama3.2:latest',
      reuse: true
    });
    assert.deepStrictEqual(selectChatModel('qwen3:0.6b', [
      { name: 'qwen3:0.6b', context_length: 32768 }
    ], 4096), {
      model: 'qwen3:0.6b',
      reuse: false
    });
    assert.deepStrictEqual(heavyModelsExcept('qwen3:0.6b', loaded), ['llama3.2:latest']);
    assert.deepStrictEqual(heavyModelsExcept('llama3.2:latest', loaded), []);
    assert.deepStrictEqual(heavyModelsExcept('llama3.2:latest', [
      { name: 'qwen3:0.6b', size: 522653767, context_length: 4096 }
    ]), []);
  });
});
