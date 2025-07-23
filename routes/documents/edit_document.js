'use strict';

// Dependencies
const crypto = require('crypto');
const mimeTypes = require('mime-types');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res) {
  const trx = await this.db.transaction();
  try {
    const { title, content, pinned, folders } = req.body;
    const prior = await trx('documents')
      .where('fabric_id', req.params.fabricID)
      .andWhere('status', '!=', 'deleted')
      .andWhere(function() {
        this.where('creator', '=', req.user.id).orWhere('owner', '=', req.user.id);
      })
      .first();
    if (!prior) {
      await trx.rollback();
      return res.status(404).send({ status: 'error', message: 'Document not found or access denied.' });
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

      // Only create a commit if the content actually changed
      if (prior.latest_blob_id !== blob.id) {
        // Create commit object with full document state
        const timestamp = new Date().toISOString();
        const parentCommit = prior.history.length > 0 ? prior.history[prior.history.length - 1] : null;

        // Get the full document object for the commit
        const fullDocument = {
          id: prior.id,
          fabric_id: prior.fabric_id,
          title: title || prior.title, // Use new title if provided, otherwise keep existing
          summary: prior.summary,
          content: contentString,
          fabric_type: prior.fabric_type,
          mime_type: prior.mime_type,
          latest_blob_id: blob.id,
          created_at: prior.created_at,
          updated_at: timestamp
        };

        const commitData = {
          timestamp: timestamp,
          parent: parentCommit,
          content: fullDocument
        };

        // Create Actor for the commit and store as blob
        const commitActor = new Actor(commitData);
        const commitJson = JSON.stringify(commitData);
        const commitPreimage = crypto.createHash('sha256').update(commitJson).digest();
        const commitHash = crypto.createHash('sha256').update(commitPreimage).digest('hex');

        // Store commit as blob
        await trx('blobs').insert({
          content: commitJson,
          fabric_id: commitActor.id,
          mime_type: 'application/json',
          preimage_sha256: commitHash
        });

        // Add commit ID to history
        prior.history.push(commitActor.id);
      }

      await trx('documents').where({ fabric_id: req.params.fabricID }).update({
        content: contentString,
        updated_at: new Date(),
        latest_blob_id: blob.id,
        history: JSON.stringify(prior.history)
      });
    }

    if (title && title !== prior.title) {
      // Create commit for title change
      const timestamp = new Date().toISOString();
      const parentCommit = prior.history && prior.history.length > 0 ? prior.history[prior.history.length - 1] : null;

      // Get the full document object for the commit
      const fullDocument = {
        id: prior.id,
        fabric_id: prior.fabric_id,
        title: title,
        summary: prior.summary,
        content: prior.content,
        fabric_type: prior.fabric_type,
        mime_type: prior.mime_type,
        latest_blob_id: prior.latest_blob_id,
        created_at: prior.created_at,
        updated_at: timestamp
      };

      const commitData = {
        timestamp: timestamp,
        parent: parentCommit,
        content: fullDocument
      };

      // Create Actor for the commit and store as blob
      const commitActor = new Actor(commitData);
      const commitJson = JSON.stringify(commitData);
      const commitPreimage = crypto.createHash('sha256').update(commitJson).digest();
      const commitHash = crypto.createHash('sha256').update(commitPreimage).digest('hex');

      // Store commit as blob
      await trx('blobs').insert({
        content: commitJson,
        fabric_id: commitActor.id,
        mime_type: 'application/json',
        preimage_sha256: commitHash
      });

      // Initialize and update history
      if (!prior.history) {
        prior.history = [];
      }
      prior.history.push(commitActor.id);

      await trx('documents').where({ fabric_id: req.params.fabricID }).update({
        title: title,
        updated_at: new Date(),
        history: JSON.stringify(prior.history)
      });
    }

    // Handle pinned field update
    if (pinned !== undefined && pinned !== prior.pinned) {
      await trx('documents').where({ fabric_id: req.params.fabricID }).update({
        pinned: pinned,
        updated_at: new Date()
      });
    }

    // Handle folders field update
    if (folders !== undefined) {
      await trx('documents').where({ fabric_id: req.params.fabricID }).update({
        folders: JSON.stringify(folders),
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
      pinned: document.pinned,
      folders: document.folders,
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
