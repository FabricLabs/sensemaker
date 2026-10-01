'use strict';

/**
 * Ollama OpenAI-compatible `/v1/chat/completions` helpers.
 * Centralizes SSE + JSON parsing so Agent.query() stays a thin orchestration layer.
 */

/**
 * True when the HTTP request carries non-empty tools (not `[]`, which is truthy in JS).
 */
function requestUsesTools (request) {
  const t = request.tools;
  if (t == null || t === false) return false;
  if (Array.isArray(t)) return t.length > 0;
  if (typeof t === 'object') return Object.keys(t).length > 0;
  return true;
}

/**
 * One SSE line: `data: {...}` (OpenAI-style) or bare JSON (native Ollama stream).
 * Mutates ctx.assembled / ctx.lastContent; calls ctx.onStreamChunk(delta) when provided.
 */
function processSseLine (trimmed, ctx) {
  const onStreamChunk = ctx.onStreamChunk;
  if (!trimmed) return {};
  let payload = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
  if (payload === '[DONE]') return { streamDone: true };
  let json;
  try {
    json = JSON.parse(payload);
  } catch {
    return {};
  }
  if (json.error) return { error: json.error };
  const deltaOpenAI = json.choices?.[0]?.delta?.content;
  if (deltaOpenAI != null && deltaOpenAI !== '') {
    ctx.assembled += deltaOpenAI;
    if (onStreamChunk) onStreamChunk(deltaOpenAI);
    return {};
  }
  const cur = (json.message && json.message.content != null) ? String(json.message.content) : '';
  if (cur) {
    let delta = '';
    if (ctx.lastContent.length && cur.startsWith(ctx.lastContent)) {
      delta = cur.slice(ctx.lastContent.length);
      ctx.lastContent = cur;
    } else {
      delta = cur;
      ctx.lastContent += cur;
    }
    if (delta) {
      ctx.assembled += delta;
      if (onStreamChunk) onStreamChunk(delta);
    }
  }
  if (json.done) return { streamDone: true };
  return {};
}

/** Strip common model "reasoning" wrappers from final text. */
function stripThinkTags (text) {
  if (!text) return text;
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Read a streaming chat/completions body (ReadableStream or full buffer as text).
 */
async function consumeChatCompletionStream (response, onStreamChunk) {
  const ctx = { lastContent: '', assembled: '', onStreamChunk };
  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let incomplete = '';
    let streamDone = false;
    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      incomplete += decoder.decode(value, { stream: true });
      const parts = incomplete.split('\n');
      incomplete = parts.pop() || '';
      for (const line of parts) {
        const r = processSseLine(line.trim(), ctx);
        if (r.error) throw r.error;
        if (r.streamDone) {
          streamDone = true;
          break;
        }
      }
    }
    if (!streamDone && incomplete.trim()) {
      const r = processSseLine(incomplete.trim(), ctx);
      if (r.error) throw r.error;
    }
  } else {
    const text = await response.text();
    for (const line of text.split('\n')) {
      const r = processSseLine(line.trim(), ctx);
      if (r.error) throw r.error;
      if (r.streamDone) break;
    }
  }
  return stripThinkTags(ctx.assembled);
}

/**
 * Non-streaming body: single JSON object, or SSE lines if the server streamed anyway.
 */
function parseChatCompletionJsonOrSse (text) {
  try {
    return JSON.parse(text);
  } catch {
    const ctx = { lastContent: '', assembled: '', onStreamChunk: null };
    for (const line of (text || '').split('\n')) {
      const r = processSseLine(line.trim(), ctx);
      if (r.error) throw r.error;
      if (r.streamDone) break;
    }
    if (ctx.assembled.length > 0) {
      return { choices: [{ message: { content: stripThinkTags(ctx.assembled) } }] };
    }
    throw new Error('Invalid chat completion response (not JSON or SSE).');
  }
}

module.exports = {
  requestUsesTools,
  processSseLine,
  stripThinkTags,
  consumeChatCompletionStream,
  parseChatCompletionJsonOrSse
};
