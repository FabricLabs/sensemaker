'use strict';

/**
 * Bridges OpenAI-compatible SSE (HTTP) with signed Fabric {@link Message} frames for chat streaming.
 *
 * - **HTTP edge**: `text/event-stream` lines `data: {JSON}\n\n` per OpenAI `chat.completion.chunk` / `[DONE]`.
 * - **Fabric bus**: {@link Message#fromVector} + {@link Message#signWithKey} + `hub.http.broadcast`.
 *
 * Subscribers should use {@link verifyStreamMessage} with the hub’s public key.
 */

const crypto = require('crypto');
const Message = require('@fabric/core/types/message');

function newCompletionId () {
  return 'chatcmpl-' + crypto.randomBytes(12).toString('hex');
}

/**
 * Build and sign a Fabric message, then broadcast on the HTTP bridge.
 * @param {object} hub Sensemaker instance (`key`, `http.broadcast`)
 * @param {string} fabricType Vector type string (uses {@code ChatMessage} — a registered AMP opcode; {@code MessageChunk}/{@code MessageStart} are not wire-registered and decode as generic P2P frames)
 * @param {object} payload JSON-serializable body (stored as vector[1] string)
 * @returns {Message}
 */
function broadcastSignedFabric (hub, fabricType, payload) {
  const fabricMsg = Message.fromVector([fabricType, JSON.stringify(payload)]);
  if (hub.key && hub.key.private) fabricMsg.signWithKey(hub.key);
  hub.http.broadcast(fabricMsg);
  return fabricMsg;
}

function fabricStreamStart (hub, payload) {
  return broadcastSignedFabric(hub, 'ChatMessage', payload);
}

function fabricStreamChunk (hub, payload) {
  return broadcastSignedFabric(hub, 'ChatMessage', payload);
}

/**
 * @param {Message} fabricMessage
 * @param {object} key Fabric key with `verify` / `verifySchnorrHash` (hub.key)
 */
function verifyStreamMessage (fabricMessage, key) {
  if (!key) return false;
  try {
    return fabricMessage.verifyWithKey(key);
  } catch {
    return false;
  }
}

/** OpenAI `chat.completion.chunk` object (one SSE JSON payload). */
function openAiChatCompletionChunk ({ id, model, created, delta, finishReason = null }) {
  return {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    system_fingerprint: 'fp_sensemaker',
    choices: [{ index: 0, delta: delta || {}, finish_reason: finishReason }]
  };
}

function writeSseEvent (res, obj) {
  if (!res || res.writableEnded) return;
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

function writeSseDone (res) {
  if (!res || res.writableEnded) return;
  res.write('data: [DONE]\n\n');
}

module.exports = {
  newCompletionId,
  broadcastSignedFabric,
  fabricStreamStart,
  fabricStreamChunk,
  verifyStreamMessage,
  openAiChatCompletionChunk,
  writeSseEvent,
  writeSseDone
};
