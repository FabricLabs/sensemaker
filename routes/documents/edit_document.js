'use strict';

// Dependencies
const crypto = require('crypto');
const mimeTypes = require('mime-types');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res) {
  const trx = await this.db.transaction();
  try {
    const { title, content } = req.body;
    const prior = await trx('documents').where('fabric_id', req.params.fabricID).first();
    if (!prior) {
      await trx.rollback();
      return res.status(404).send({ status: 'error', message: 'Document not found.' });
    }

    if (content) {
      // Ensure content is a string
      const contentString = typeof content === 'string' ? content : String(content);
      const blob = new Actor({ content: contentString });
      const existing = await trx('blobs').where({ fabric_id: blob.id }).first();
      if (!existing) {
        const preimage = crypto.createHash('sha256').update(contentString).digest();
        const hash = crypto.createHash('sha256').update(preimage).digest('hex');
        await trx('blobs').insert({
          content: contentString,
          fabric_id: blob.id,
          mime_type: prior.mime_type,
          preimage_sha256: hash
        });
      }

      // Initialize history array if it doesn't exist
      if (!prior.history) {
        prior.history = [];
      }

      if (prior.latest_blob_id !== blob.id) {
        prior.history.push(blob.id);
      }

      await trx('documents').where({ fabric_id: req.params.fabricID }).update({
        content: contentString,
        updated_at: new Date(),
        latest_blob_id: blob.id,
        history: JSON.stringify(prior.history)
      });
    }

    if (title) {
      await trx('documents').where({ fabric_id: req.params.fabricID }).update({
        title: title,
        updated_at: new Date()
      });
    }

    const document = await trx('documents').where('fabric_id', req.params.fabricID).orderBy('created_at', 'desc').first();
    await trx.commit();

    return res.send({
      id: document.fabric_id,
      title: document.title,
      summary: document.summary,
      latest_blob_id: document.latest_blob_id,
      fabric_type: document.fabric_type,
      mime_type: document.mime_type,
      content: document.content,
      history: document.history,
      created_at: document.created_at,
      updated_at: document.updated_at
    });
  } catch (exception) {
    await trx.rollback();
    return res.status(503).send({
      type: 'EditDocumentError',
      content: exception.message || exception
    });
  }
};
