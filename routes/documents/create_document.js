'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');
const {
  FILE_DOCUMENT_TYPES,
  CANVAS_STARTER,
  detectDocumentType,
  isFileDocumentType,
  isTextDocumentType,
  looksLikeText,
  mimeForDocumentType
} = require('../../functions/detectDocumentType');

module.exports = async function (req, res, next) {
  // TODO: make error messages nicer, use both HTML and JSON depending on header
  if (!req.user || !req.user.id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  // Handle file-based document creation
  if (req.body.file_id) {
    // Look up the file by fabric_id
    const file = await this.db('files').where({ fabric_id: req.body.file_id }).first();
    if (!file) {
      return res.status(404).json({ status: 'error', message: 'File not found' });
    }

    console.debug('[DOCUMENTS:CREATE] Found file:', {
      id: file.id,
      name: file.name,
      type: file.type,
      blob_id: file.blob_id,
      fabric_id: file.fabric_id
    });

    // Get the blob associated with this file
    const blob = await this.db('blobs').where({ preimage_sha256: file.blob_id }).first();
    if (!blob) {
      console.error('[DOCUMENTS:CREATE] Blob not found for preimage_sha256:', file.blob_id);
      return res.status(404).json({ status: 'error', message: 'File blob not found' });
    }

    console.debug('[DOCUMENTS:CREATE] Found blob:', {
      fabric_id: blob.fabric_id,
      mime_type: blob.mime_type,
      contentType: typeof blob.content,
      isBuffer: Buffer.isBuffer(blob.content),
      contentLength: blob.content ? blob.content.length : 0
    });

    const actor = new Actor({ content: blob.content });
    const bytes = Buffer.isBuffer(blob.content) ? blob.content : Buffer.from(blob.content || '', 'binary');
    const detected = detectDocumentType({ name: file.name, mime: file.type, bytes });

    const requested = req.body.type;
    if (requested && !isFileDocumentType(requested)) {
      return res.status(400).json({ status: 'error', message: `Unsupported document type for a file: ${requested}` });
    }

    let fabricType = detected.type;
    let mimeType = detected.mime || file.type || 'application/octet-stream';
    if (requested && requested !== detected.type) {
      fabricType = requested;
      mimeType = FILE_DOCUMENT_TYPES.find((t) => t.name === requested).mime;
    }

    let content = null;
    if (isTextDocumentType(fabricType)) {
      if (!looksLikeText(bytes)) {
        return res.status(400).json({ status: 'error', message: `${file.name} is not UTF-8 text, so it cannot be stored as ${fabricType}.` });
      }
      content = bytes.toString('utf8');
    }

    try {
      // Create document record referencing the existing blob
      await this.db('documents').insert({
        creator: req.user.id,
        owner: req.user.id,
        fabric_id: actor.id,
        title: req.body.title || file.name,
        summary: req.body.summary || '',
        status: 'published',
        ingestion_status: 'processing',
        latest_blob_id: blob.fabric_id,
        history: JSON.stringify([blob.fabric_id]),
        mime_type: mimeType,
        fabric_type: fabricType,
        content,
        file_id: file.id
      });

      return res.send({ ...actor.toJSON(), id: actor.id });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Failed to create document' });
    }
  }

  // Handle text-based document creation (original logic)
  const content = req.body?.content || '';
  const obj = merge({
    type: 'Text'
  }, req.body, {
    created: (new Date()).toISOString()
  });

  let mimeType = mimeForDocumentType(obj.type);
  if ((obj.type === 'Image' || obj.type === 'Audio' || obj.type === 'Video') && (obj.mime_type || req.body.mime_type)) {
    mimeType = obj.mime_type || req.body.mime_type;
  }

  // Set default content for certain document types
  if (!obj.content) {
    switch (obj.type) {
      case 'Graph':
        obj.content = 'digraph TD {\n  A -> B\n  B -> C\n}';
        break;
      case 'List':
        obj.content = JSON.stringify([]);
        break;
      case 'Folder':
        obj.content = JSON.stringify([]);
        break;
      case 'Canvas':
        obj.content = CANVAS_STARTER;
        break;
      default:
        obj.content = '';
        break;
    }
  }

  console.debug('Creating text-based document:', obj);

  // TODO: parse JSON, return to object before creating Actor
  const stored = obj.content || content || '';
  const actor = new Actor(obj);
  const blob = new Actor({ content: stored });
  const existing = await this.db('blobs').where({ fabric_id: blob.id }).first();
  if (!existing) {
    await this.db('blobs').insert({
      content: stored,
      fabric_id: blob.id,
      mime_type: mimeType
    });
  }

  // TODO: handle errors
  await this.db('documents').insert({
    creator: req.user.id,
    owner: req.user.id,
    fabric_id: actor.id,
    title: obj.title,
    summary: obj.summary || '',
    content: stored,
    status: 'draft',
    // ingestion_status: 'ingested',
    latest_blob_id: blob.id,
    history: JSON.stringify([blob.id]),
    mime_type: mimeType,
    fabric_type: obj.type
  });

  // TODO: send with `id` not `@id`
  return res.send({ ...actor.toJSON(), id: actor.id });
};
