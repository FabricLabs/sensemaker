'use strict';

// Dependencies
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mimeTypes = require('mime-types');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Message = require('@fabric/core/types/message');

async function http_create_file (req, res, next) {
  // TODO: refactor to use chaining instead of try/catch
  try {
    if (!req.user || !req.user.id) {
      res.status(401);
      res.send({ status: 'error', message: 'Not authorized!' });
      return;
    }

    if (!req.file) {
      res.status(400);
      res.send({ status: 'error', message: 'No file uploaded!' });
      return;
    }

    // TODO: standardize the file upload logic into core (folder to look for, folder to move to, etc.)
    const safeFilename = path.basename(req.file.originalname);
    const userDir = path.join(this.settings.files.userstore, req.user.id);
    const destination = path.join(userDir, safeFilename);

    // TODO: restrict file types
    const mimeType = mimeTypes.lookup(destination);
    const savedFile = await this.db('files').insert({
      creator: req.user.id,
      name: req.file.originalname,
      path: destination,
      type: mimeType,
      status: 'processing', // initial status
    });

    const queueMessage = {
      type: 'IngestFile',
      param_id: savedFile[0],
      creator: req.user.id
    };

    // const messageFile = Message.fromVector([queueMessage.type, JSON.stringify(queueMessage)]);
    // this.http.broadcast(messageFile);

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    fs.rename(req.file.path, destination, async (err) => {
      if (err) {
        res.status(500);
        res.send({ status: 'error', message: 'Failed to move file to destination.', content: err });
        // TODO: report file for cleanup / investigation
        return;
      }

      fs.readFile(destination, async (err, data) => {
        if (err) {
          res.status(500);
          res.send({ status: 'error', message: 'Failed to read file.' });
          return;
        }

        try {
          // Fabric ID: name + content pair
          const actor = new Actor({ name: req.file.originalname, content: data.toString('binary') });
          const preimage = crypto.createHash('sha256').update(data).digest();
          const hash = crypto.createHash('sha256').update(preimage).digest('hex');

          console.debug('[FILES:CREATE] Processing file:', {
            filename: req.file.originalname,
            mimeType,
            dataSize: data.length,
            actorId: actor.id,
            hash
          });

          const existingBlob = await this.db('blobs').where({ preimage_sha256: hash }).first();
          if (!existingBlob) {
            await this.db('blobs').insert({
              fabric_id: actor.id,
              content: data, // Always store original Buffer for binary data
              mime_type: mimeType,
              preimage: preimage.toString('hex'),
              preimage_sha256: hash
            });
            console.debug('[FILES:CREATE] Created new blob with fabric_id:', actor.id);
          } else {
            console.debug('[FILES:CREATE] Using existing blob:', existingBlob.fabric_id);
          }

          // Update the file record with the fabric_id
          await this.db('files')
            .where({ id: savedFile[0] })
            .update({
              fabric_id: actor.id,
              blob_id: hash,
              updated_at: new Date(),
              preimage_sha256: hash,
              status: 'uploaded'
            });

          // Clean up the file from filesystem since it's now stored as a blob in the database
          try {
            fs.unlinkSync(destination);
            console.debug('[FILES:CREATE] Cleaned up file from filesystem:', destination);
          } catch (cleanupError) {
            console.warn('[FILES:CREATE] Failed to clean up file from filesystem:', cleanupError);
            // Non-fatal error - file is already in database, so we can continue
          }

          // Immediately ingest the file content so it's available for conversation
          try {
            await this.trainer.ingestDocument({
              content: data.toString('utf8'),
              metadata: {
                owner: req.user.id,
                file_id: savedFile[0],
                fabric_id: actor.id,
                filename: req.file.originalname,
                mime_type: mimeType,
                type: 'file',
                blob_id: hash,
                preimage_sha256: hash,
                file_size: data.length,
                created_at: new Date().toISOString()
              }
            }, 'file');

            // Update status to ingested since we just processed it
            await this.db('files').where('id', savedFile[0]).update({
              status: 'ingested',
              updated_at: new Date()
            });

            console.debug('[FILES:CREATE] File immediately ingested and ready for conversation');
          } catch (ingestionError) {
            console.error('[FILES:CREATE] Failed to immediately ingest file:', ingestionError);
            // Fall back to queue if immediate ingestion fails
            this.queue.addJob({
              method: 'IngestFile',
              params: [savedFile[0]],
              attempts: 3
            });
            console.debug('[FILES:CREATE] Queued file for background ingestion due to immediate ingestion failure');
          }

          const response = {
            status: 'success',
            message: 'Successfully uploaded file! Processing will begin shortly.',
            document_id: actor.id,
            file_id: savedFile[0],
            fabric_id: actor.id,
            id: actor.id
          };

          console.debug('[FILES:CREATE] Sending response:', response);
          res.send(response);
        } catch (updateError) {
          console.error('Failed to update file status:', updateError);
          res.status(500);
          res.send({ status: 'error', message: 'Failed to update file status.', content: updateError });
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send({ status: 'error', message: 'An unexpected error occurred.', content: error });
  }
}

module.exports = http_create_file;
