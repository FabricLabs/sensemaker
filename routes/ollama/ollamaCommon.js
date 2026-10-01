'use strict';

const Actor = require('@fabric/core/types/actor');
const chatStreamBridge = require('../../services/chatStreamBridge');
function ollamaCreatedAt () {
  return new Date().toISOString();
}

function ollamaMessageContent (c) {
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c.map((part) => {
      if (typeof part === 'string') return part;
      if (part && part.type === 'text' && part.text) return part.text;
      return '';
    }).join('\n');
  }
  return JSON.stringify(c || '');
}

function lastUserQueryFromMessages (messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return ollamaMessageContent(messages[i].content);
    }
  }
  if (messages.length) {
    return ollamaMessageContent(messages[messages.length - 1].content);
  }
  return '';
}

function beginNdjson (res) {
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
}

function writeNdjson (res, obj) {
  if (!res || res.writableEnded) return;
  res.write(`${JSON.stringify(obj)}\n`);
}

function ndjsonError (res, err) {
  if (!res || res.writableEnded) return;
  try {
    writeNdjson(res, { error: err.message || String(err) });
  } catch (e) { /* ignore */ }
  res.end();
}

/**
 * Stream Ollama-shaped NDJSON while mirroring token deltas on the Fabric bridge.
 */
async function runOllamaChatStream (hub, res, { model, messages, query, temperature, maxTokens }) {
  const streamActor = new Actor({ type: 'OllamaApiChat', model });
  beginNdjson(res);
  chatStreamBridge.fabricStreamStart(hub, {
    id: streamActor.id,
    model,
    protocol: 'ollama-chat'
  });

  try {
    await hub.pool.query({
      model,
      query,
      messages,
      stream: true,
      temperature,
      max_tokens: maxTokens,
      onStreamChunk: (delta) => {
        chatStreamBridge.fabricStreamChunk(hub, {
          id: streamActor.id,
          protocol: 'ollama-chat',
          content: delta,
          model
        });
        writeNdjson(res, {
          model,
          created_at: ollamaCreatedAt(),
          message: { role: 'assistant', content: delta },
          done: false
        });
      }
    });
    writeNdjson(res, {
      model,
      created_at: ollamaCreatedAt(),
      done: true
    });
    res.end();
  } catch (err) {
    console.error('[OLLAMA:MIRROR]', '/api/chat stream', err);
    ndjsonError(res, err);
  }
}

/**
 * Stream Ollama /api/generate shaped NDJSON.
 */
async function runOllamaGenerateStream (hub, res, { model, prompt, temperature, maxTokens }) {
  const messages = [{ role: 'user', content: prompt }];
  const query = prompt;
  const streamActor = new Actor({ type: 'OllamaApiGenerate', model });
  beginNdjson(res);
  chatStreamBridge.fabricStreamStart(hub, {
    id: streamActor.id,
    model,
    protocol: 'ollama-generate'
  });

  try {
    await hub.pool.query({
      model,
      query,
      messages,
      stream: true,
      temperature,
      max_tokens: maxTokens,
      onStreamChunk: (delta) => {
        chatStreamBridge.fabricStreamChunk(hub, {
          id: streamActor.id,
          protocol: 'ollama-generate',
          content: delta,
          model
        });
        writeNdjson(res, {
          model,
          created_at: ollamaCreatedAt(),
          response: delta,
          done: false
        });
      }
    });
    writeNdjson(res, {
      model,
      created_at: ollamaCreatedAt(),
      done: true
    });
    res.end();
  } catch (err) {
    console.error('[OLLAMA:MIRROR]', '/api/generate stream', err);
    ndjsonError(res, err);
  }
}

module.exports = {
  ollamaCreatedAt,
  lastUserQueryFromMessages,
  beginNdjson,
  writeNdjson,
  ndjsonError,
  runOllamaChatStream,
  runOllamaGenerateStream
};
