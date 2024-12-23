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

    // // TODO: allow duplicate file upload
    // const documentExist = await this.db('documents')
    //   .where('filename', req.file.originalname)
    //   .andWhere('owner', '=', req.user.id)
    //   .first();

    // if (documentExist) {
    //   res.status(400);
    //   res.send({ status: 'error', message: 'Document already exists. Please upload a different one.' });
    //   return;
    // }

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
      creator: req.user.id,
    }

    const messageFile = Message.fromVector([queueMessage.type, JSON.stringify(queueMessage)]);
    this.http.broadcast(messageFile);

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
          await this.db('files')
            .where({ id: savedFile[0] })
            .update({
              updated_at: new Date(),
              status: 'uploaded',
            });

          this.http.broadcast(messageFile);

          const hash = crypto.createHash('sha256').update(data);
          const digest = hash.digest('hex');
          const actor = new Actor({ content: data.toString('utf8') });
          // TODO: preserve additional fields (ctime, mtime, etc.)
          const insertedDocument = await this.db('documents').insert({
            title: req.file.originalname,
            content: data.toString('utf8'),
            fabric_id: actor.id,
            encoding: 'utf8',
            filename: req.file.originalname,
            sha256: digest,
            creator: req.user.id,
            owner: req.user.id,
            file_id: savedFile[0],
            ingestion_status: 'processing',
            latest_blob_id: actor.id,
            mime_type: mimeType,
            history: JSON.stringify([actor.id]),
          });

          // Queue jobs
          // TODO: fix / troubleshoot ingestion of large files
          /* this.queue.addJob({
            method: 'IngestFile',
            params: [savedFile[0]],
            attempts: 3,
          }); */

          /* this.queue.addJob({
            method: 'IngestDocument',
            params: [insertedDocument[0]],
            attempts: 3,
          }); */

          res.send({ status: 'success', message: 'Successfully uploaded file!', document_id: actor.id, file_id: savedFile[0], fabric_id: actor.id });
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
