'use strict';

/**
 * Public mesh shoutbox helpers.
 *
 * The wire body is raw UTF-8 on `P2P_CHAT_MESSAGE`. A JSON chat envelope
 * (`{ type: 'P2P_CHAT_MESSAGE' }` or `{ actor, object }`) is rejected by
 * Fabric Peer and must not be published.
 *
 * @fileoverview Sensemaker shoutbox text, alias, and Peer publish helpers.
 */

const Message = require('@fabric/core/types/message');

const P2P_CHAT_MAX_CHARS = 2000;
const P2P_PEER_ALIAS_MAX_CHARS = 64;

/**
 * True when a parsed object is a legacy chat envelope Peer will drop.
 * @param {*} parsed
 * @returns {boolean}
 */
function isChatEnvelope (parsed) {
  return !!(parsed && typeof parsed === 'object' && !Array.isArray(parsed) &&
    (parsed.type === 'P2P_CHAT_MESSAGE' || (parsed.actor && parsed.object)));
}

/**
 * @param {string} text
 * @returns {string}
 * @private
 */
function clipText (text) {
  const raw = String(text || '');
  if (!raw.trim()) return '';
  if (raw.length > P2P_CHAT_MAX_CHARS) return '';
  return raw.trim();
}

/**
 * Display / publish text from a string, Peer `{ text }` event, or Hub cache.
 * @param {*} value
 * @returns {string}
 */
function shoutboxTextOf (value) {
  if (value == null) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > P2P_CHAT_MAX_CHARS) return '';
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (isChatEnvelope(parsed)) {
          const inner = (parsed.object && (parsed.object.content || parsed.object.body))
            || parsed.text
            || parsed.content
            || parsed.body;
          return shoutboxTextOf(inner);
        }
      } catch (_) { /* literal text that happens to start with a brace */ }
    }
    return trimmed;
  }
  if (typeof value !== 'object') return '';
  if (typeof value.text === 'string' && value.text.trim()) return clipText(value.text);
  if (value.object && typeof value.object.content === 'string') return clipText(value.object.content);
  if (value.object && typeof value.object.body === 'string') return clipText(value.object.body);
  if (typeof value.content === 'string') return clipText(value.content);
  if (typeof value.body === 'string') return shoutboxTextOf(value.body);
  return '';
}

/**
 * Reject empty, oversized, and envelope bodies before they hit the mesh.
 * @param {*} input
 * @returns {string}
 */
function assertShoutboxText (input) {
  const source = typeof input === 'string' ? input : shoutboxTextOf(input);
  const text = String(source || '').trim();
  if (!text) {
    const err = new Error('message text required');
    err.code = 'SHOUTBOX_TEXT';
    throw err;
  }
  if (text.length > P2P_CHAT_MAX_CHARS) {
    const err = new Error('message exceeds 2000 chars');
    err.code = 'SHOUTBOX_TEXT';
    throw err;
  }
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      if (isChatEnvelope(parsed)) {
        const err = new Error('shoutbox body must be UTF-8 text, not a JSON chat envelope');
        err.code = 'SHOUTBOX_ENVELOPE';
        throw err;
      }
    } catch (err) {
      if (err && err.code === 'SHOUTBOX_ENVELOPE') throw err;
    }
  }
  return text;
}

/**
 * Node nickname for `P2P_PEER_ALIAS`, when one is configured.
 * @param {Object} [settings]
 * @returns {string}
 */
function shoutboxAlias (settings) {
  if (!settings || typeof settings !== 'object') return '';
  const fabric = settings.fabric && typeof settings.fabric === 'object' ? settings.fabric : {};
  const candidates = [settings.alias, settings.moniker, settings.nickname, fabric.alias];
  for (let i = 0; i < candidates.length; i++) {
    if (typeof candidates[i] !== 'string') continue;
    const name = candidates[i].trim().slice(0, P2P_PEER_ALIAS_MAX_CHARS);
    if (!name || name.startsWith('{') || name.startsWith('[')) continue;
    return name;
  }
  return '';
}

/**
 * UI row for Global chat. Accepts Peer `{ text }` and Hub `{ object.content }`.
 * @param {Object} msg
 * @returns {{ type: string, content: string, actor: string|null, created: number }|null}
 */
function shoutboxDisplay (msg) {
  if (!msg || typeof msg !== 'object') return null;
  const type = msg.type;
  const isChat = !type || type === 'P2P_CHAT_MESSAGE' || type === 'ChatMessage' || type === 'CHAT_MESSAGE';
  if (!isChat) return null;
  if (msg.target && msg.target !== '/messages') return null;
  const content = shoutboxTextOf(msg);
  if (!content) return null;
  const actor = (msg.actor && (msg.actor.id || msg.actor.publicKey || msg.actor.pubkey))
    || msg.signer
    || (msg.headers && msg.headers.author)
    || null;
  const created = (msg.object && msg.object.created) || msg.created || Date.now();
  return {
    type: 'P2P_CHAT_MESSAGE',
    content,
    actor: actor != null ? String(actor) : null,
    created: Number(created) || Date.now()
  };
}

/**
 * Sign a cleartext shoutbox frame and hand it to Peer.relayFrom.
 * Announces `P2P_PEER_ALIAS` when `alias` is non-empty.
 * @param {Object} opts
 * @param {Object} opts.peer
 * @param {Object} opts.key
 * @param {*} opts.text
 * @param {string} [opts.alias]
 * @param {string} [opts.origin]
 * @returns {{ ok: boolean, type: string, content: string, packet: Object }}
 */
function publishShoutboxOnPeer (opts) {
  const options = opts || {};
  const peer = options.peer;
  if (!peer || typeof peer.relayFrom !== 'function') {
    throw new Error('No Fabric peer available.');
  }
  const key = options.key;
  if (!key || !key.private) throw new Error('No signing key for shoutbox.');
  const text = assertShoutboxText(options.text);
  const packet = Message.fromVector(['P2P_CHAT_MESSAGE', text]).signWithKey(key);
  const origin = options.origin || peer.id || '_sensemaker';
  peer.relayFrom(origin, packet);
  const alias = typeof options.alias === 'string' ? options.alias.trim().slice(0, P2P_PEER_ALIAS_MAX_CHARS) : '';
  if (alias && !alias.startsWith('{') && !alias.startsWith('[') && typeof peer._announceAlias === 'function') {
    peer._announceAlias(alias);
  }
  return {
    ok: true,
    type: 'P2P_CHAT_MESSAGE',
    content: text,
    packet
  };
}

/**
 * Frame to fan out to local WebSocket clients.
 * Prefer the original signed wire so the author stays the mesh signer.
 * @param {*} msg
 * @param {Object} [meta]
 * @param {Object} [key]
 * @returns {Object|null}
 */
function shoutboxWireForClients (msg, meta, key) {
  const text = shoutboxTextOf(msg);
  if (!text) return null;
  const wire = meta && meta.wireMessage;
  const sealed = !!(msg && msg.onionSealed);
  if (wire && typeof wire.toBuffer === 'function' && !sealed) return wire;
  const packet = Message.fromVector(['P2P_CHAT_MESSAGE', text]);
  if (key && key.private) packet.signWithKey(key);
  return packet;
}

module.exports = {
  P2P_CHAT_MAX_CHARS,
  P2P_PEER_ALIAS_MAX_CHARS,
  isChatEnvelope,
  shoutboxTextOf,
  assertShoutboxText,
  shoutboxAlias,
  shoutboxDisplay,
  publishShoutboxOnPeer,
  shoutboxWireForClients
};
