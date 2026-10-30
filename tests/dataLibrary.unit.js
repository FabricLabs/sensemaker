'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const Key = require('@fabric/core/types/key');
const Message = require('@fabric/core/types/message');
const Peer = require('@fabric/core/types/peer');
const dataLibrary = require('../functions/dataLibrary');

function memoryDb (seed) {
  const tables = {
    documents: (seed && seed.documents) ? seed.documents.map((row) => Object.assign({}, row)) : [],
    blobs: (seed && seed.blobs) ? seed.blobs.map((row) => Object.assign({}, row)) : []
  };
  return function (name) {
    const filters = [];
    const match = (row) => filters.every((filter) => {
      return Object.keys(filter).every((key) => row[key] === filter[key]);
    });
    const api = {
      where (criteria, value) {
        if (criteria && typeof criteria === 'object') filters.push(criteria);
        else filters.push({ [criteria]: value });
        return api;
      },
      first () {
        return Promise.resolve(tables[name].find(match) || null);
      },
      insert (row) {
        const copy = Object.assign({ id: tables[name].length + 1 }, row);
        tables[name].push(copy);
        return Promise.resolve([copy.id]);
      },
      update (patch) {
        const hits = tables[name].filter(match);
        hits.forEach((row) => Object.assign(row, patch));
        return Promise.resolve(hits.length);
      },
      select () {
        return Promise.resolve(tables[name].filter(match).map((row) => Object.assign({}, row)));
      }
    };
    return api;
  };
}

function context (db, peer, root) {
  return {
    root,
    db,
    peer,
    loadMembers (folder) { return dataLibrary.loadMembers(db, folder); },
    loadBytes (doc) { return dataLibrary.loadBytes(db, doc); }
  };
}

describe('data libraries', function () {
  const folderId = 'folder-library-1';
  const body = 'hello library';
  const sha = crypto.createHash('sha256').update(body).digest('hex');
  let root;
  let owner;
  let friend;
  let stranger;
  let sent;

  beforeEach(function () {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'sensemaker-library-'));
    owner = new Peer({ listen: false, peersDb: null });
    friend = new Key();
    stranger = new Key();
    sent = { friend: 0, stranger: 0 };
    owner.connections[friend.pubkey + '@127.0.0.1:1'] = {
      _writeFabric () { sent.friend += 1; return true; }
    };
    owner.connections[stranger.pubkey + '@127.0.0.1:2'] = {
      _writeFabric () { sent.stranger += 1; return true; }
    };
  });

  afterEach(function () {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function seed () {
    return memoryDb({
      documents: [
        {
          fabric_id: folderId,
          fabric_type: 'Folder',
          title: 'Library',
          content: JSON.stringify(['doc-1']),
          status: 'published',
          owner: 1,
          creator: 1
        },
        {
          fabric_id: 'doc-1',
          fabric_type: 'Text',
          title: 'Notes',
          mime_type: 'text/plain',
          content: body,
          status: 'published',
          owner: 1,
          creator: 1
        }
      ]
    });
  }

  it('keeps the library contract id stable when the peer list changes', function () {
    const publisher = owner.key.pubkey;
    const first = dataLibrary.libraryContractId(folderId, publisher);
    const second = dataLibrary.libraryContractId(folderId, publisher);
    assert.strictEqual(first, second);
    assert.notStrictEqual(first, dataLibrary.libraryContractId('other-folder', publisher));
    assert.strictEqual(first.length, 64);
  });

  it('folds a shared catalog for the recipient and ignores everyone else', async function () {
    const db = seed();
    const shared = await dataLibrary.shareRecipients(
      context(db, owner, root),
      folderId,
      [friend.pubkey]
    );
    assert.strictEqual(shared.error, null);
    assert.ok(shared.frames > 0);
    assert.ok(sent.friend > 0);
    assert.strictEqual(sent.stranger, 0);
    assert.ok(owner.getDocumentBuffer(sha).equals(Buffer.from(body)));

    const saved = dataLibrary.readState(root);
    const entry = saved.libraries[folderId];
    const hex = entry.collection.messages[0].hex;
    const msg = Message.fromBuffer(Buffer.from(hex, 'hex'));
    const parsed = Message.tryParseLegacyBody(msg);
    assert.strictEqual(parsed.ok, true);
    const wire = {
      contract: entry.contractId,
      object: parsed.value,
      wireMessage: msg
    };

    const received = memoryDb();
    const folded = await dataLibrary.ingestLibraryFrame(
      context(received, { key: friend }, path.join(root, 'friend')),
      wire
    );
    assert.strictEqual(folded.folded, true);
    const stubs = await received('documents').select();
    assert.strictEqual(stubs.length, 1);
    assert.strictEqual(stubs[0].fabric_type, 'LibraryReceipt');
    assert.strictEqual(stubs[0].title, 'Notes');
    assert.strictEqual(stubs[0].sha256, sha);
    assert.strictEqual(stubs[0].ingestion_status, 'processing');
    assert.strictEqual(stubs[0].content, null);
    assert.strictEqual(stubs[0].owner, null);

    const ignored = memoryDb();
    const skipped = await dataLibrary.ingestLibraryFrame(
      context(ignored, { key: stranger }, path.join(root, 'stranger')),
      wire
    );
    assert.strictEqual(skipped.folded, false);
    assert.strictEqual((await ignored('documents').select()).length, 0);

    const ownerCtx = context(db, owner, root);
    assert.strictEqual(dataLibrary.libraryRequestAllowed(ownerCtx, {
      documentId: sha,
      message: { author: friend.pubkey }
    }), true);
    assert.strictEqual(dataLibrary.libraryRequestAllowed(ownerCtx, {
      documentId: sha,
      message: { author: stranger.pubkey }
    }), false);

    owner.pendingDocumentRequests = owner.pendingDocumentRequests || {};
    owner.pendingDocumentRequests.req = {
      key: 'req',
      documentId: sha,
      peerAddress: friend.pubkey + '@127.0.0.1:1',
      parsed: {}
    };
    const approved = await dataLibrary.maybeApproveLibraryRequest(ownerCtx, {
      documentId: sha,
      pendingKey: 'req',
      message: { author: friend.pubkey }
    });
    assert.strictEqual(approved.approved, true, approved.error);
    assert.strictEqual(owner._collectDocumentCatalogInventoryItems().some((item) => item.id === sha), false);

    const revoked = await dataLibrary.revokeRecipients(ownerCtx, folderId, [friend.pubkey]);
    assert.deepStrictEqual(revoked.recipients, []);
    assert.strictEqual(dataLibrary.libraryRequestAllowed(ownerCtx, {
      documentId: sha,
      message: { author: friend.pubkey }
    }), false);
  });
});
