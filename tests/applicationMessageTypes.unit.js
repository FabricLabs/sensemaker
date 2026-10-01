'use strict';

const assert = require('assert');
const core = require('@fabric/core/functions/applicationNamespaces');
const {
  OUTER,
  CONTRACT_BODY_TYPES,
  APP_CONTRACT_BODY_TYPES,
  ACTIVITY_TYPES,
  isKnownContractBodyType,
  isApplicationOuterType,
  fromCore
} = require('../contracts/applicationMessageTypes');
const {
  createMemoryStore,
  ingestMessageBuffer
} = require('@fabric/core/functions/contractMessageAccumulate');
const Key = require('@fabric/core/types/key');
const Message = require('@fabric/core/types/message');

describe('Sensemaker applicationMessageTypes', function () {
  it('re-exports core OUTER and merges core ARC body types', function () {
    assert.strictEqual(fromCore, true);
    assert.strictEqual(OUTER.P2P_CHAT_MESSAGE, core.OUTER.P2P_CHAT_MESSAGE);
    assert.strictEqual(OUTER.CONTRACT_MESSAGE, core.OUTER.CONTRACT_MESSAGE);
    assert.ok(CONTRACT_BODY_TYPES.GroupChat);
    assert.ok(CONTRACT_BODY_TYPES.MessageReceived);
    assert.ok(CONTRACT_BODY_TYPES.MessageReceipt);
    assert.strictEqual(isKnownContractBodyType('GroupChat'), true);
    assert.strictEqual(isKnownContractBodyType('MessageReceipt'), true);
  });

  it('does not pull product gameplay / mission types into Sensemaker catalog', function () {
    assert.strictEqual(isKnownContractBodyType('MissionBroadcast'), false);
    assert.strictEqual(isKnownContractBodyType('GroupShare'), false);
    assert.strictEqual(isKnownContractBodyType('SCEventBatch'), false);
    assert.strictEqual(isKnownContractBodyType('GameStateSnapshot'), false);
    assert.deepStrictEqual(APP_CONTRACT_BODY_TYPES, {});
  });

  it('keeps Beacon activity types from core (no GameStateSnapshot)', function () {
    assert.strictEqual(ACTIVITY_TYPES.FederationSignRequest, 'FederationSignRequest');
    assert.strictEqual(ACTIVITY_TYPES.GameStateSnapshot, undefined);
  });

  it('recognizes application outer types', function () {
    assert.strictEqual(isApplicationOuterType('P2P_CHAT_MESSAGE'), true);
    assert.strictEqual(isApplicationOuterType('CONTRACT_MESSAGE'), true);
  });

  it('accumulates CONTRACT_MESSAGE via core helper (mesh/paste converge)', function () {
    const contractId = 'e'.repeat(64);
    const key = new Key();
    const genesis = { signers: [key.pubkey], readers: [key.pubkey] };
    const msg = Message.fromVector(['CONTRACT_MESSAGE', JSON.stringify({
      contract: contractId,
      type: 'GroupChat',
      object: { body: 'sensemaker-arc', author: key.pubkey, ts: '2026-08-11T00:00:00.000Z' }
    })]).signWithKey(key);
    const buf = msg.toBuffer();
    const storeA = createMemoryStore();
    const storeB = createMemoryStore();
    const a = ingestMessageBuffer(storeA, contractId, buf, { origin: 'mesh', genesis });
    const b = ingestMessageBuffer(storeB, contractId, `fabric:${buf.toString('hex')}`, { origin: 'paste', genesis });
    assert.strictEqual(a.accepted, true, a.error);
    assert.strictEqual(b.accepted, true, b.error);
    assert.strictEqual(a.tip.stateDigest, b.tip.stateDigest);
  });
});
