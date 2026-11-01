'use strict';

/**
 * A Sensemaker folder shared as a Fabric DocumentList.
 * The log is a FabricMessageCollection of signed CONTRACT_MESSAGE frames.
 * Only the recipient named on a frame folds it. File bytes stay local until
 * that peer's DOCUMENT_REQUEST is approved.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const Actor = require('@fabric/core/types/actor');
const Message = require('@fabric/core/types/message');
const { pubkeyXOnly, pubkeysMatch } = require('@fabric/core/functions/pubkey');
const {
  DOCUMENT_LIST_TYPE,
  chunkDocumentList,
  foldDocumentList,
  compactDocumentRow
} = require('@fabric/core/functions/documentList');
const {
  createCollection,
  collectionTipId,
  ingest,
  toJSON,
  fromJSON,
  replay
} = require('@fabric/core/functions/fabricMessageCollection');

const RECEIPT_TYPE = 'LibraryReceipt';
const STATE_FILE = 'document-lists.json';

function libraryGenesis (folderId, publisher) {
  return {
    name: 'Sensemaker Data Library',
    type: 'DataLibrary',
    folderId: String(folderId),
    signers: [String(publisher)]
  };
}

function libraryContractId (folderId, publisher) {
  return new Actor(libraryGenesis(folderId, publisher)).id;
}

function statePath (root) {
  return path.join(root, 'libraries', STATE_FILE);
}

function emptyState () {
  return { v: 1, libraries: {} };
}

function readState (root) {
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath(root), 'utf8'));
    if (!parsed || typeof parsed !== 'object' || !parsed.libraries) return emptyState();
    return parsed;
  } catch (err) {
    return emptyState();
  }
}

function writeState (root, state) {
  const file = statePath(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, file);
}

function collectionOf (entry) {
  if (entry && entry.collection) return fromJSON(entry.collection);
  return createCollection();
}

/**
 * `parseContractMessageBody` returns `{ contract, type, object }`. A flat
 * DocumentList (documents on the payload) is the `object` when that field is
 * the payload itself.
 * @param {object} value
 * @returns {object|null}
 */
function documentListOf (value) {
  if (!value || typeof value !== 'object') return null;
  if (value.type === DOCUMENT_LIST_TYPE && Array.isArray(value.documents)) return value;
  const nested = value.object;
  if (nested && typeof nested === 'object' && Array.isArray(nested.documents)) {
    return Object.assign({ type: value.type || nested.type || DOCUMENT_LIST_TYPE }, nested);
  }
  return null;
}

function listsFromCollection (collection) {
  const frames = [];
  replay(collection, (ctx) => {
    const list = documentListOf(ctx.inner);
    if (!list) return;
    frames.push(Object.assign({}, list, {
      hash: ctx.record && ctx.record.hash
    }));
  });
  return frames;
}

function foldEntry (entry) {
  return foldDocumentList(listsFromCollection(collectionOf(entry)));
}

function publisherOf (peer) {
  const key = peer && peer.key;
  if (!key) return null;
  const raw = key.pubkey || key.publicKey || null;
  return raw ? String(raw) : null;
}

function normalizeRecipients (list, publisher) {
  const out = [];
  const seen = new Set();
  const rows = Array.isArray(list) ? list : [];
  for (const item of rows) {
    const x = pubkeyXOnly(item);
    if (!x || seen.has(x)) continue;
    if (publisher && pubkeysMatch(x, publisher)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function parseIdList (value) {
  let data = value;
  if (typeof data === 'string') {
    if (!data.trim()) return [];
    try {
      data = JSON.parse(data);
    } catch (err) {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];
  const out = [];
  for (const item of data) {
    if (typeof item === 'string' && item.trim()) out.push(item.trim());
    else if (item && typeof item === 'object' && item.id) out.push(String(item.id).trim());
  }
  return out;
}

function shouldFoldDocumentList (object, localPubkey) {
  const list = documentListOf(object);
  if (!list || !list.recipient || !localPubkey) return false;
  return pubkeysMatch(list.recipient, localPubkey);
}

function projectReceipt (row) {
  return {
    fabric_id: row.id,
    title: row.name || 'Untitled',
    mime_type: row.mime || 'application/octet-stream',
    sha256: row.sha256 || null,
    file_size: row.size != null ? row.size : null,
    latest_blob_id: row.id,
    ingestion_status: 'processing',
    content: null,
    fabric_type: RECEIPT_TYPE,
    summary: 'Waiting on file bytes.',
    status: 'published',
    owner: null,
    creator: null
  };
}

async function upsertLibraryReceipts (db, documents, previousIds) {
  const nextIds = [];
  const seen = new Set();
  for (const row of documents) {
    if (!row || !row.id) continue;
    const projected = projectReceipt(row);
    seen.add(projected.fabric_id);
    nextIds.push(projected.fabric_id);
    const existing = await db('documents').where({ fabric_id: projected.fabric_id }).first();
    if (existing && existing.fabric_type !== RECEIPT_TYPE) continue;
    if (existing) {
      await db('documents').where({ fabric_id: projected.fabric_id }).update({
        title: projected.title,
        mime_type: projected.mime_type,
        sha256: projected.sha256,
        file_size: projected.file_size,
        ingestion_status: 'processing',
        summary: projected.summary,
        status: 'published',
        fabric_type: RECEIPT_TYPE
      });
    } else {
      await db('documents').insert(projected);
    }
  }
  const prior = Array.isArray(previousIds) ? previousIds : [];
  for (const id of prior) {
    if (seen.has(id)) continue;
    const existing = await db('documents').where({ fabric_id: id }).first();
    if (existing && existing.fabric_type === RECEIPT_TYPE) {
      await db('documents').where({ fabric_id: id }).update({ status: 'deleted' });
    }
  }
  return nextIds;
}

function catalogRowFromDocument (doc, bytes) {
  const buf = bytes == null
    ? null
    : (Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes));
  const sha256 = buf && buf.length
    ? crypto.createHash('sha256').update(buf).digest('hex')
    : null;
  return compactDocumentRow({
    id: sha256 || String(doc.fabric_id),
    sha256,
    name: doc.title || doc.filename || 'file',
    mime: doc.mime_type || 'application/octet-stream',
    size: buf ? buf.length : 0
  });
}

function catalogDelta (current, previous) {
  const prev = new Map();
  for (const row of previous || []) {
    if (row && row.id) prev.set(row.id, row);
  }
  const documents = [];
  const next = new Set();
  for (const row of current) {
    next.add(row.id);
    const old = prev.get(row.id);
    if (!old || JSON.stringify(old) !== JSON.stringify(row)) documents.push(row);
  }
  for (const [id, old] of prev) {
    if (next.has(id)) continue;
    documents.push({ id, sha256: old.sha256, removed: true });
  }
  return documents;
}

async function loadMembers (db, folder) {
  const ids = new Set(parseIdList(folder && folder.content));
  const probe = db('documents');
  if (probe && typeof probe.whereRaw === 'function' && folder && folder.fabric_id) {
    try {
      const tagged = await db('documents').whereRaw(
        'JSON_CONTAINS(folders, ?)',
        [JSON.stringify(folder.fabric_id)]
      );
      for (const row of tagged || []) {
        if (row && row.fabric_id && row.status !== 'deleted') ids.add(row.fabric_id);
      }
    } catch (err) {
      // Not every database has JSON_CONTAINS. Folder content still counts.
    }
  }
  const rows = [];
  for (const id of ids) {
    const row = await db('documents').where({ fabric_id: id }).first();
    if (!row || row.status === 'deleted') continue;
    if (folder && row.fabric_id === folder.fabric_id) continue;
    rows.push(row);
  }
  return rows;
}

async function loadBytes (db, doc) {
  if (!doc) return Buffer.alloc(0);
  if (doc.content != null && doc.content !== '') {
    return Buffer.isBuffer(doc.content) ? doc.content : Buffer.from(String(doc.content), 'utf8');
  }
  if (!doc.latest_blob_id) return Buffer.alloc(0);
  const blob = await db('blobs').where({ fabric_id: doc.latest_blob_id }).first();
  if (!blob || blob.content == null) return Buffer.alloc(0);
  return Buffer.isBuffer(blob.content) ? blob.content : Buffer.from(String(blob.content), 'utf8');
}

function deliverToRecipient (peer, recipient, buffer) {
  if (!peer || !peer.connections || !buffer) return 0;
  let n = 0;
  for (const id of Object.keys(peer.connections)) {
    const conn = peer.connections[id];
    const candidates = [String(id).split('@')[0]];
    const info = peer.peers && peer.peers[id];
    if (info) {
      if (info.publicKey) candidates.push(info.publicKey);
      if (info.pubkey) candidates.push(info.pubkey);
      if (info.id) candidates.push(info.id);
    }
    if (conn && conn.pubkey) candidates.push(conn.pubkey);
    const hit = candidates.some((candidate) => pubkeysMatch(candidate, recipient));
    if (hit && conn && typeof conn._writeFabric === 'function') {
      conn._writeFabric(buffer);
      n += 1;
    }
  }
  return n;
}

function appendLists (collection, lists, contractId, key) {
  const messages = [];
  for (const list of lists) {
    const msg = Message.fromLegacyBody('CONTRACT_MESSAGE', Object.assign({ contract: contractId }, list));
    Message.setMessageParent(msg, collectionTipId(collection));
    msg.signWithKey(key);
    const saved = ingest(collection, msg);
    if (!saved.accepted) {
      throw new Error(saved.error || 'document list frame rejected');
    }
    messages.push(msg);
  }
  return messages;
}

function retainHolds (peer, holds) {
  if (!peer || typeof peer.retainLocalDocument !== 'function') return;
  for (const hold of holds) {
    if (!hold || !hold.id || hold.bytes == null) continue;
    peer.retainLocalDocument(hold.id, hold.bytes);
  }
}

async function currentCatalog (ctx, folder) {
  const members = await ctx.loadMembers(folder);
  const documents = [];
  const holds = [];
  const holdIndex = {};
  for (const member of members) {
    const bytes = await ctx.loadBytes(member);
    const row = catalogRowFromDocument(member, bytes);
    if (!row) continue;
    documents.push(row);
    holdIndex[row.id] = member.fabric_id;
    if (bytes && bytes.length) holds.push({ id: row.id, bytes });
  }
  return { documents, holds, holdIndex };
}

async function syncLibrary (ctx, folderId, opts = {}) {
  const state = readState(ctx.root);
  const entry = state.libraries[String(folderId)];
  if (!entry || !entry.recipients || !entry.recipients.length) {
    return { shared: false, frames: 0 };
  }
  const folder = await ctx.db('documents').where({ fabric_id: String(folderId) }).first();
  if (!folder || folder.fabric_type !== 'Folder') return { shared: false, frames: 0 };
  const publisher = publisherOf(ctx.peer);
  const key = ctx.peer && ctx.peer.key;
  if (!key || !publisher) {
    const error = new Error('Fabric peer key required');
    error.code = 'no_peer';
    throw error;
  }
  const catalog = await currentCatalog(ctx, folder);
  const folded = foldEntry(entry);
  const delta = catalogDelta(catalog.documents, folded.documents);
  const fullFor = opts.fullFor instanceof Set ? opts.fullFor : new Set(opts.fullFor || []);
  const observedAt = new Date().toISOString();
  const collection = collectionOf(entry);
  let frames = 0;
  for (const recipient of entry.recipients) {
    const documents = fullFor.has(recipient) ? catalog.documents : delta;
    if (!documents.length) continue;
    const chunks = chunkDocumentList({
      libraryId: entry.contractId,
      contract: entry.contractId,
      publisher: entry.publisher || publisher,
      recipient,
      observedAt,
      documents
    });
    const messages = appendLists(collection, chunks, entry.contractId, key);
    frames += messages.length;
    for (const msg of messages) deliverToRecipient(ctx.peer, recipient, msg.toBuffer());
  }
  entry.collection = toJSON(collection);
  entry.holds = catalog.holdIndex;
  entry.updatedAt = observedAt;
  writeState(ctx.root, state);
  retainHolds(ctx.peer, catalog.holds);
  return {
    shared: true,
    frames,
    documents: catalog.documents.length,
    contractId: entry.contractId,
    recipients: entry.recipients.slice()
  };
}

async function shareRecipients (ctx, folderId, peers) {
  const publisher = publisherOf(ctx.peer);
  if (!publisher) {
    return { error: 'no_peer' };
  }
  const id = String(folderId);
  const folder = await ctx.db('documents').where({ fabric_id: id }).first();
  if (!folder || folder.status === 'deleted') return { error: 'not_found' };
  if (folder.fabric_type !== 'Folder') return { error: 'not_folder' };
  const adding = normalizeRecipients(peers, publisher);
  if (!adding.length) return { error: 'no_peers' };
  const state = readState(ctx.root);
  let entry = state.libraries[id];
  const before = new Set(entry && entry.recipients ? entry.recipients : []);
  if (!entry) {
    entry = {
      folderId: id,
      publisher,
      contractId: libraryContractId(id, publisher),
      recipients: [],
      receiptIds: [],
      holds: {},
      collection: null,
      received: false
    };
    state.libraries[id] = entry;
  }
  for (const recipient of adding) {
    if (!entry.recipients.includes(recipient)) entry.recipients.push(recipient);
  }
  writeState(ctx.root, state);
  const fullFor = adding.filter((recipient) => !before.has(recipient));
  const synced = await syncLibrary(ctx, id, { fullFor });
  const saved = readState(ctx.root).libraries[id];
  return Object.assign({
    error: null,
    contractId: entry.contractId,
    recipients: (saved && saved.recipients) || entry.recipients
  }, synced);
}

async function revokeRecipients (ctx, folderId, peers) {
  const publisher = publisherOf(ctx.peer);
  const key = ctx.peer && ctx.peer.key;
  if (!publisher || !key) return { error: 'no_peer' };
  const id = String(folderId);
  const state = readState(ctx.root);
  const entry = state.libraries[id];
  if (!entry) return { error: null, revoked: [], recipients: [] };
  const drop = new Set(normalizeRecipients(peers));
  const revoked = entry.recipients.filter((recipient) => drop.has(recipient));
  if (!revoked.length) {
    return { error: null, revoked: [], recipients: entry.recipients.slice() };
  }
  const folded = foldEntry(entry);
  const observedAt = new Date().toISOString();
  const collection = collectionOf(entry);
  if (folded.documents.length) {
    for (const recipient of revoked) {
      const chunks = chunkDocumentList({
        libraryId: entry.contractId,
        contract: entry.contractId,
        publisher: entry.publisher || publisher,
        recipient,
        observedAt,
        documents: folded.documents.map((row) => ({
          id: row.id,
          sha256: row.sha256,
          removed: true
        }))
      });
      const messages = appendLists(collection, chunks, entry.contractId, key);
      for (const msg of messages) deliverToRecipient(ctx.peer, recipient, msg.toBuffer());
    }
  }
  entry.recipients = entry.recipients.filter((recipient) => !drop.has(recipient));
  entry.collection = toJSON(collection);
  entry.updatedAt = observedAt;
  writeState(ctx.root, state);
  return {
    error: null,
    revoked,
    recipients: entry.recipients.slice(),
    contractId: entry.contractId
  };
}

async function describeLibrary (ctx, folderId) {
  const id = String(folderId);
  const state = readState(ctx.root);
  const entry = state.libraries[id];
  if (!entry) {
    return {
      folderId: id,
      shared: false,
      contractId: null,
      recipients: [],
      documents: 0
    };
  }
  const folded = foldEntry(entry);
  return {
    folderId: id,
    shared: entry.recipients.length > 0,
    contractId: entry.contractId,
    recipients: entry.recipients.slice(),
    documents: folded.documents.length,
    received: entry.received === true
  };
}

async function ingestLibraryFrame (ctx, ev) {
  const object = ev && ev.object;
  const me = pubkeyXOnly(publisherOf(ctx.peer));
  if (!shouldFoldDocumentList(object, me)) return { folded: false };
  const contract = String((ev && ev.contract) || (object && object.libraryId) || '').trim();
  if (!contract) return { folded: false };
  const wire = ev && ev.wireMessage;
  if (!wire) return { folded: false, error: 'wire frame required' };
  const state = readState(ctx.root);
  let folderId = null;
  let entry = null;
  for (const id of Object.keys(state.libraries)) {
    if (state.libraries[id].contractId === contract) {
      folderId = id;
      entry = state.libraries[id];
      break;
    }
  }
  if (!entry) {
    folderId = contract;
    entry = {
      folderId,
      publisher: object.publisher || null,
      contractId: contract,
      recipients: [],
      receiptIds: [],
      holds: {},
      collection: null,
      received: true
    };
    state.libraries[folderId] = entry;
  }
  const collection = collectionOf(entry);
  const saved = ingest(collection, wire);
  if (!saved.accepted && !saved.duplicate) {
    return { folded: false, error: saved.error };
  }
  entry.collection = toJSON(collection);
  const folded = foldDocumentList(listsFromCollection(collection));
  const receiptIds = await upsertLibraryReceipts(ctx.db, folded.documents, entry.receiptIds);
  entry.receiptIds = receiptIds;
  writeState(ctx.root, state);
  return { folded: true, documents: folded.documents, receiptIds };
}

function requestAuthor (payload) {
  const message = payload && payload.message;
  if (!message) return null;
  try {
    return message.author || null;
  } catch (err) {
    return null;
  }
}

function libraryRequestAllowed (ctx, payload) {
  const author = requestAuthor(payload);
  const docId = payload && (payload.documentId || payload.document);
  if (!author || !docId) return false;
  const state = readState(ctx.root);
  for (const entry of Object.values(state.libraries)) {
    if (!entry || entry.received) continue;
    const allowed = (entry.recipients || []).some((recipient) => pubkeysMatch(recipient, author));
    if (!allowed) continue;
    const folded = foldEntry(entry);
    if (folded.documents.some((row) => row.id === docId || row.sha256 === docId)) return true;
  }
  return false;
}

async function bytesForCatalogId (ctx, catalogId) {
  const state = readState(ctx.root);
  for (const entry of Object.values(state.libraries)) {
    if (!entry || entry.received || !entry.holds) continue;
    const fabricId = entry.holds[catalogId];
    if (!fabricId) continue;
    const doc = await ctx.db('documents').where({ fabric_id: fabricId }).first();
    if (!doc) continue;
    return ctx.loadBytes(doc);
  }
  return null;
}

async function maybeApproveLibraryRequest (ctx, payload) {
  if (!libraryRequestAllowed(ctx, payload)) return { approved: false };
  const peer = ctx.peer;
  const docId = payload.documentId || payload.document;
  if (peer && typeof peer.getDocumentBuffer === 'function' && !peer.getDocumentBuffer(docId)) {
    const bytes = await bytesForCatalogId(ctx, docId);
    if (bytes && bytes.length && typeof peer.retainLocalDocument === 'function') {
      peer.retainLocalDocument(docId, bytes);
    }
  }
  if (!payload.pendingKey || !peer || typeof peer.approveDocumentRequest !== 'function') {
    return { approved: false, held: true };
  }
  const result = peer.approveDocumentRequest(payload.pendingKey);
  return { approved: !!(result && result.ok), error: result && result.error };
}

async function restoreHolds (ctx) {
  const peer = ctx.peer;
  if (!peer || typeof peer.retainLocalDocument !== 'function') return { held: 0 };
  const state = readState(ctx.root);
  let held = 0;
  for (const entry of Object.values(state.libraries)) {
    if (!entry || entry.received || !entry.holds) continue;
    for (const catalogId of Object.keys(entry.holds)) {
      const doc = await ctx.db('documents').where({ fabric_id: entry.holds[catalogId] }).first();
      if (!doc) continue;
      const bytes = await ctx.loadBytes(doc);
      if (!bytes || !bytes.length) continue;
      if (peer.retainLocalDocument(catalogId, bytes)) held += 1;
    }
  }
  return { held };
}

function redeliver (ctx) {
  const peer = ctx.peer;
  if (!peer) return 0;
  const state = readState(ctx.root);
  let n = 0;
  for (const entry of Object.values(state.libraries)) {
    if (!entry || entry.received) continue;
    const collection = collectionOf(entry);
    replay(collection, (frame) => {
      const recipient = frame.inner && frame.inner.recipient;
      if (!recipient || !frame.buffer) return;
      n += deliverToRecipient(peer, recipient, frame.buffer);
    });
  }
  return n;
}

module.exports = {
  RECEIPT_TYPE,
  DOCUMENT_LIST_TYPE,
  libraryGenesis,
  libraryContractId,
  readState,
  writeState,
  statePath,
  normalizeRecipients,
  parseIdList,
  shouldFoldDocumentList,
  projectReceipt,
  upsertLibraryReceipts,
  catalogRowFromDocument,
  catalogDelta,
  loadMembers,
  loadBytes,
  shareRecipients,
  revokeRecipients,
  syncLibrary,
  describeLibrary,
  ingestLibraryFrame,
  libraryRequestAllowed,
  maybeApproveLibraryRequest,
  restoreHolds,
  redeliver,
  publisherOf
};
