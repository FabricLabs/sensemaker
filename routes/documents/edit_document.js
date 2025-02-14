'use strict';

const Actor = require('@fabric/core/types/actor');
const mimeTypes = require('mime-types');

module.exports = async function (req, res) {
  try {
    const { title, content } = req.body;
    const prior = await this.db('documents').where('fabric_id', req.params.fabricID).first();
    if (!prior) return res.statusCode(404).send({ status: 'error', message: 'Document not found.' });

    if (content) {
      const blob = new Actor({ content: content });
      const existing = await this.db('blobs').where({ fabric_id: blob.id }).first();
      if (!existing) {
        const inserted = await this.db('blobs').insert({
          content: content,
          fabric_id: blob.id,
          mime_type: prior.mime_type
        });
      }

      if (prior.latest_blob_id !== blob.id) {
        prior.history.push(blob.id);
      }

      await this.db('documents').where({ fabric_id: req.params.fabricID }).update({
        content: content,
        updated_at: new Date(),
        latest_blob_id: blob.id,
        history: JSON.stringify(prior.history)
      });
    }

    if (title) {
      await this.db('documents').where({ fabric_id: req.params.fabricID }).update({
        title: title
      });
    }

    const document = await this.db('documents').where('fabric_id', req.params.fabricID).orderBy('created_at', 'desc').first();
    res.send({
      id: document.fabric_id,
      title: document.title,
      latest_blob_id: document.latest_blob_id,
      mime_type: document.mime_type,
      content: document.content,
      history: document.history
    });
  } catch (exception) {
    console.debug('[SENSEMAKER]', 'Error editing document:', exception);
    res.status(503);
    return res.send({
      type: 'EditDocumentError',
      content: exception
    });
  }
};
