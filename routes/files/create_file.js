'use strict';

// Dependencies
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mimeTypes = require('mime-types');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

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

    // TODO: allow duplicate file upload
    const documentExist = await this.db('documents').where('filename', req.file.originalname).andWhere('owner','=',req.user.id).first();
    if (documentExist) {
      res.status(400);
      res.send({ status: 'error', message: 'Document already exist. Please upload a different one.' });
      return;
    }

    // TODO: standardize the file upload logic into Jeeves (folder to look for, folder to move to, etc.)
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
    });

    const insertedFile = await this.db('files').where({ id: savedFile[0] }).first(); //getting the inserted row in files
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    fs.rename(req.file.path, destination, (err) => {
      if (err) {
        res.status(500);
        res.send({ status: 'error', message: 'Failed to move file to destination.', content: err });
        // TODO: report file for cleanup / investigation
        return;
      }

      fs.readFile(destination, (err, data) => {
        if (err) {
          res.status(500);
          res.send({ status: 'error', message: 'Failed to read file.' });
          return;
        }

        console.debug('[FILES]', 'Ingesting file:', req.file.originalname);
        const hash = crypto.createHash('sha256').update(data);
        const digest = hash.digest('hex');
        const actor = new Actor({ content: data.toString('utf8') });

        this.db('documents').insert({
          title: req.file.originalname,
          content: data.toString('utf8'),
          fabric_id: actor.id,
          encoding: 'utf8',
          filename: req.file.originalname,
          sha256: digest,
          owner: req.user.id,
          courtlistener_filepath_local: destination,
          file_id: savedFile[0],

        }).then((insertedDocument) => {
          console.debug('[FILES]', 'Inserted document:', insertedDocument[0]);

          // queue job
          this.queue.addJob({
            method: 'IngestDocument',
            params: [insertedDocument[0]]
          });

          // TODO: subscribe to job completion for this file (via Redis)
          this.queue.addJob({
            method: 'IngestFile',
            params: [savedFile[0]]
          });

          res.send({ status: 'success', message: 'Successfully uploaded file!', file_id: savedFile[0], fabric_id: actor.id });
          /* this.trainer.ingestDocument({
            content: data.toString('utf8'),
            encoding: 'utf8',
            filename: req.file.originalname,
            sha256: digest,
            owner: req.user.id,
          }).then((ingestedDocument) => {
            res.send({ status: 'success', message: 'Successfully uploaded file!', file_id: savedFile[0], fabric_id:actor.id });
          }); */
        });
      });
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = http_create_file;
