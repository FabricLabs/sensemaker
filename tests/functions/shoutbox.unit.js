'use strict';

const assert = require('assert');
const Key = require('@fabric/core/types/key');
const {
  assertShoutboxText,
  isChatEnvelope,
  publishShoutboxOnPeer,
  shoutboxAlias,
  shoutboxDisplay,
  shoutboxTextOf,
  shoutboxWireForClients
} = require('../../functions/shoutbox');

describe('shoutbox', function () {
  const key = new Key();

  function peer () {
    const sent = [];
    const aliases = [];
    return {
      id: 'local',
      sent,
      aliases,
      relayFrom (origin, message) {
        sent.push({ origin, type: message.type, body: message.body });
      },
      _announceAlias (name) {
        aliases.push(name);
      }
    };
  }

  it('publishes raw UTF-8 and a separate alias', function () {
    const node = peer();
    const result = publishShoutboxOnPeer({
      peer: node,
      key,
      text: 'hello mesh',
      alias: 'SENSEMAKER',
      origin: 'local'
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.content, 'hello mesh');
    assert.strictEqual(node.sent.length, 1);
    assert.strictEqual(node.sent[0].origin, 'local');
    assert.strictEqual(node.sent[0].type, 'P2P_CHAT_MESSAGE');
    assert.strictEqual(node.sent[0].body, 'hello mesh');
    assert.deepStrictEqual(node.aliases, ['SENSEMAKER']);
  });

  it('refuses a JSON chat envelope', function () {
    const envelope = JSON.stringify({
      type: 'P2P_CHAT_MESSAGE',
      actor: { id: 'user' },
      object: { content: 'nope', created: 1 }
    });
    assert.strictEqual(isChatEnvelope(JSON.parse(envelope)), true);
    assert.throws(() => assertShoutboxText(envelope), /JSON chat envelope/);
    assert.throws(() => publishShoutboxOnPeer({ peer: peer(), key, text: envelope }), /JSON chat envelope/);
  });

  it('renders Peer text and Hub object.content as the same row', function () {
    const fromPeer = shoutboxDisplay({ type: 'P2P_CHAT_MESSAGE', text: 'hello mesh', signer: 'abc' });
    const fromHub = shoutboxDisplay({
      type: 'P2P_CHAT_MESSAGE',
      actor: { id: 'abc' },
      object: { content: 'hello mesh', created: 5 }
    });
    assert.strictEqual(fromPeer.content, 'hello mesh');
    assert.strictEqual(fromHub.content, 'hello mesh');
    assert.strictEqual(fromPeer.content, fromHub.content);
    assert.strictEqual(shoutboxTextOf('hello mesh'), 'hello mesh');
  });

  it('fans inbound wire through unchanged and opened seals as UTF-8', function () {
    const wire = { toBuffer () { return Buffer.from('frame'); } };
    assert.strictEqual(shoutboxWireForClients({ text: 'hello' }, { wireMessage: wire }), wire);
    const opened = shoutboxWireForClients(
      { text: 'opened', onionSealed: true },
      { wireMessage: wire },
      key
    );
    assert.notStrictEqual(opened, wire);
    assert.strictEqual(opened.body, 'opened');
    assert.strictEqual(opened.type, 'P2P_CHAT_MESSAGE');
  });

  it('reads a nickname and skips JSON aliases', function () {
    assert.strictEqual(shoutboxAlias({ alias: 'SENSEMAKER' }), 'SENSEMAKER');
    assert.strictEqual(shoutboxAlias({ alias: '{bad}', moniker: 'Desk' }), 'Desk');
    assert.strictEqual(shoutboxAlias({}), '');
    const node = peer();
    publishShoutboxOnPeer({ peer: node, key, text: 'no nick' });
    assert.deepStrictEqual(node.aliases, []);
  });
});
