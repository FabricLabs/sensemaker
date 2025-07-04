'use strict';

const crypto = require('crypto');
const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

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

    // Determine fabric_type based on file mime type and extension
    let fabricType = 'File'; // default
    const fileName = file.name.toLowerCase();
    const mimeType = file.type;

    if (mimeType && mimeType.startsWith('image/')) {
      fabricType = 'Image';
    } else if (mimeType && mimeType.startsWith('audio/') ||
      fileName.endsWith('.mp3') || fileName.endsWith('.wav') ||
      fileName.endsWith('.ogg') || fileName.endsWith('.m4a') ||
      fileName.endsWith('.flac') || fileName.endsWith('.aac') ||
      fileName.endsWith('.wma') || fileName.endsWith('.opus')) {
      fabricType = 'Audio';
    } else if (mimeType && mimeType.startsWith('video/') ||
      fileName.endsWith('.mp4') || fileName.endsWith('.avi') ||
      fileName.endsWith('.mov') || fileName.endsWith('.mkv') ||
      fileName.endsWith('.webm') || fileName.endsWith('.flv') ||
      fileName.endsWith('.wmv') || fileName.endsWith('.m4v') ||
      fileName.endsWith('.3gp') || fileName.endsWith('.ogv')) {
      fabricType = 'Video';
    } else if (mimeType === 'text/markdown' || fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
      fabricType = 'Markdown';
    } else if (mimeType === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      fabricType = 'HTML';
    } else if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
      fabricType = 'Text';
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
        mime_type: file.type || 'application/octet-stream',
        fabric_type: fabricType,
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

  let mimeType = 'text/plain';

  switch (obj.type) {
    case 'Markdown':
      mimeType = 'text/markdown';
      break;
    case 'HTML':
      mimeType = 'text/html';
      break;
    case 'List':
      mimeType = 'application/json';
      break;
    case 'Folder':
      mimeType = 'application/json';
      break;
    case 'Image':
      // For images, use the provided mime type or default to image/png
      mimeType = obj.mime_type || req.body.mime_type || 'image/png';
      break;
    case 'Audio':
      // For audio, use the provided mime type or default to audio/mpeg
      mimeType = obj.mime_type || req.body.mime_type || 'audio/mpeg';
      break;
    case 'Video':
      // For video, use the provided mime type or default to video/mp4
      mimeType = obj.mime_type || req.body.mime_type || 'video/mp4';
      break;
    default:
      mimeType = 'text/plain';
      break;
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
      default:
        obj.content = '';
        break;
    }
  }

  console.debug('Creating text-based document:', obj);

  // TODO: parse JSON, return to object before creating Actor
  const actor = new Actor(obj);
  const blob = new Actor({ content: content || '' });
  const preimage = crypto.createHash('sha256').update(content).digest('hex');
  const hash = crypto.createHash('sha256').update(preimage).digest('hex');
  const existing = await this.db('blobs').where({ fabric_id: blob.id }).first();
  if (!existing) {
    await this.db('blobs').insert({
      content: content,
      fabric_id: blob.id,
      mime_type: 'text/plain'
    });
  }

  // TODO: handle errors
  await this.db('documents').insert({
    creator: req.user.id,
    owner: req.user.id,
    fabric_id: actor.id,
    title: obj.title,
    summary: obj.summary || '',
    content: obj.content || '',
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
