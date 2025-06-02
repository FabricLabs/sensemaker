'use strict';

const crypto = require('crypto');
const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  // TODO: make error messages nicer, use both HTML and JSON depending on header
  if (!req.user || !req.user.id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
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
    default:
      mimeType = 'text/plain';
      break;
  }

  console.debug('Request body:', req.body);
  console.debug('Creating obj:', obj);

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
    fabric_id: actor.id,
    title: obj.title,
    summary: obj.summary || '',
    content: obj.content || '',
    status: 'draft',
    // ingestion_status: 'ingested',
    latest_blob_id: blob.id,
    history: JSON.stringify([blob.id]),
    mime_type: 'text/plain',
    fabric_type: obj.type
  });

  // TODO: send with `id` not `@id`
  return res.send({ ...actor.toJSON(), id: actor.id });
};
