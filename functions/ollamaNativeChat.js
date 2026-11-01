'use strict';

const fetch = require('cross-fetch');
const { SMALL_MODEL } = require('../constants');

/** Weights or a context window large enough that a second load kills the runner. */
const HEAVY_BYTES = 2 * 1024 * 1024 * 1024;
const HEAVY_CONTEXT = 16384;

let turn = Promise.resolve();

/**
 * Hold the Ollama HTTP turn so a small-model call and a capable-model call
 * do not load at the same time.
 * @returns {Promise<function(): void>}
 */
function acquireOllamaTurn () {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const wait = turn;
  turn = wait.then(() => gate);
  return wait.then(() => release);
}

/**
 * Ollama's runner closed while swapping a model into memory.
 * @param {string} text
 * @returns {boolean}
 */
function isRunnerLoadEof (text) {
  const msg = String(text || '');
  return /do load request/i.test(msg) && /EOF/i.test(msg);
}

/**
 * @param {number} attempt 1-based retry number
 * @returns {Promise<void>}
 */
function waitForRunner (attempt) {
  const delayMs = attempt === 1 ? 2000 : 5000;
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Native `/api/chat` body. Thinking stays off and the context window stays
 * explicit so the runner does not load the model's full default window.
 * @param {string} query
 * @param {object} [options]
 * @param {string} [options.model]
 * @param {number} [options.num_ctx]
 * @param {number} [options.num_predict]
 * @param {object[]} [options.messages]
 * @param {object[]} [options.tools]
 * @returns {object}
 */
function buildNativeChatBody (query, options) {
  const opts = options || {};
  const body = {
    model: opts.model || SMALL_MODEL,
    think: false,
    stream: false,
    messages: (Array.isArray(opts.messages) && opts.messages.length)
      ? opts.messages
      : [{ role: 'user', content: String(query || '') }],
    options: {
      temperature: 0,
      num_predict: opts.num_predict || 500
    }
  };
  if (Array.isArray(opts.tools) && opts.tools.length) body.tools = opts.tools;
  // Changing num_ctx on a model that is already loaded starts a new runner.
  if (!opts.reuseLoaded) body.options.num_ctx = opts.num_ctx || 4096;
  return body;
}

/**
 * @param {{ name?: string, model?: string }} row
 * @returns {string}
 */
function modelName (row) {
  return (row && (row.name || row.model)) || '';
}

/**
 * Always keep the requested tag. `reuse` is only true when that same tag is
 * already loaded, so a small-model call is never answered by a larger one.
 * @param {string} requestedModel
 * @param {Array<{ name?: string, model?: string }>} loaded
 * @returns {{ model: string, reuse: boolean }}
 */
function selectChatModel (requestedModel, loaded, numCtx) {
  const requested = requestedModel || SMALL_MODEL;
  const models = Array.isArray(loaded) ? loaded : [];
  const row = models.find((item) => modelName(item) === requested);
  let reuse = !!row;
  if (reuse && numCtx != null && Number(row.context_length) !== Number(numCtx)) reuse = false;
  return { model: requested, reuse: reuse };
}

/**
 * Other residents big enough that loading `requested` beside them dies on `/load`.
 * @param {string} requestedModel
 * @param {Array<{ name?: string, model?: string, size?: number, context_length?: number }>} loaded
 * @returns {string[]}
 */
function heavyModelsExcept (requestedModel, loaded) {
  const requested = requestedModel || SMALL_MODEL;
  const names = [];
  const models = Array.isArray(loaded) ? loaded : [];
  for (let i = 0; i < models.length; i++) {
    const row = models[i];
    const name = modelName(row);
    if (!name || name === requested) continue;
    const bytes = Number(row && row.size) || 0;
    const ctx = Number(row && row.context_length) || 0;
    if (bytes > HEAVY_BYTES || ctx >= HEAVY_CONTEXT) names.push(name);
  }
  return names;
}

/**
 * @param {string} url
 * @returns {Promise<object[]>}
 */
async function listLoadedModels (url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) return [];
  const json = await response.json();
  return Array.isArray(json.models) ? json.models : [];
}

/**
 * Drop a resident model so a different tag can load.
 * @param {string} origin
 * @param {string} name
 * @returns {Promise<void>}
 */
async function unloadModel (origin, name) {
  const response = await fetch(`${origin}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: name, keep_alive: 0 }),
    signal: AbortSignal.timeout(20000)
  });
  const detail = await response.text().catch(() => '');
  if (!response.ok || !/unload/i.test(detail)) {
    console.warn(`[OLLAMA] Could not unload ${name}: ${String(detail).slice(0, 180)}`);
  }
}

/**
 * @param {string} origin
 * @param {string} keep
 * @returns {Promise<void>}
 */
async function unloadExcept (origin, keep) {
  let loaded = [];
  try {
    loaded = await listLoadedModels(`${origin}/api/ps`);
  } catch (err) {
    loaded = [];
  }
  for (let i = 0; i < loaded.length; i++) {
    const name = modelName(loaded[i]);
    if (!name || name === keep) continue;
    console.warn(`[OLLAMA] Unloading ${name} so ${keep} can load.`);
    await unloadModel(origin, name);
  }
}

/**
 * Unload heavy models that are not the one this call asked for.
 * @param {string} origin
 * @param {string} model
 * @returns {Promise<{ reuse: boolean }>}
 */
async function prepareSpecificModel (origin, model, numCtx) {
  const requested = model || SMALL_MODEL;
  let loaded = [];
  try {
    loaded = await listLoadedModels(`${origin}/api/ps`);
  } catch (err) {
    loaded = [];
  }
  const choice = selectChatModel(requested, loaded, numCtx);
  if (choice.reuse) return { reuse: true };
  const resident = loaded.find((item) => modelName(item) === requested);
  if (resident && numCtx != null) {
    console.warn(`[OLLAMA] Reloading ${requested} at context ${numCtx} (was ${resident.context_length}).`);
    await unloadModel(origin, requested);
  }
  const blocking = heavyModelsExcept(requested, loaded);
  for (let i = 0; i < blocking.length; i++) {
    console.warn(`[OLLAMA] Unloading ${blocking[i]} so ${requested} can load.`);
    await unloadModel(origin, blocking[i]);
  }
  return { reuse: false };
}

/**
 * Native `/api/chat` for one named model. A heavy model already in memory is
 * unloaded first so this call still runs on the tag it asked for.
 * @param {object} settings
 * @param {string} query
 * @param {object} [options]
 * @param {string} [options.model]
 * @param {number} [options.num_ctx]
 * @param {number} [options.num_predict]
 * @param {object[]} [options.messages]
 * @param {object[]} [options.tools]
 * @returns {Promise<{ content: string, model: string, message: object, tool_calls: object[] }>}
 */
async function queryOllamaNative (settings, query, options) {
  const release = await acquireOllamaTurn();
  try {
    const opts = options || {};
    const ollama = (settings && settings.ollama) || {};
    const host = ollama.host || '127.0.0.1';
    const port = ollama.port != null ? ollama.port : 11434;
    const requestedModel = opts.model || ollama.model || SMALL_MODEL;
    const origin = `http${ollama.secure ? 's' : ''}://${host}:${port}`;
    const url = `${origin}/api/chat`;
    let lastError = new Error('Ollama request failed');

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) {
        await waitForRunner(attempt);
        await unloadExcept(origin, requestedModel);
      }
      const prepared = await prepareSpecificModel(origin, requestedModel, opts.num_ctx);
      const body = buildNativeChatBody(query, {
        model: requestedModel,
        num_ctx: opts.num_ctx,
        num_predict: opts.num_predict,
        reuseLoaded: prepared.reuse && attempt === 0,
        messages: opts.messages,
        tools: opts.tools
      });
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000)
      });
      if (response.ok) {
        const json = await response.json();
        const message = (json && json.message) || {};
        const content = message.content != null ? String(message.content) : '';
        const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
        const served = (json && json.model) || requestedModel;
        if (served !== requestedModel) {
          console.warn(`[OLLAMA] Asked for ${requestedModel}; Ollama answered with ${served}.`);
        }
        return { content: content, model: served, message: message, tool_calls: toolCalls };
      }
      const detail = await response.text().catch(() => '');
      lastError = new Error(detail || `Ollama HTTP ${response.status}`);
      if (!isRunnerLoadEof(detail)) break;
      console.warn(`[OLLAMA] Runner died loading ${requestedModel}, retrying that model.`);
    }

    throw lastError;
  } finally {
    release();
  }
}

module.exports = {
  acquireOllamaTurn,
  buildNativeChatBody,
  heavyModelsExcept,
  isRunnerLoadEof,
  prepareSpecificModel,
  queryOllamaNative,
  selectChatModel,
  unloadExcept
};
