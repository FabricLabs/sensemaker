'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mimeTypes = require('mime-types');


module.exports = async function (req, res, next) {

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

    const safeFilename = path.basename(req.file.originalname);
    const userDir = path.join(this.settings.files.userstore, req.user.id);
    const destination = path.join(userDir, safeFilename);
    console.log("el destino", destination);

    console.log(req.user.id, req.file.originalname, destination, mimeType);
    const mimeType = mimeTypes.lookup(destination);
     await this.db('files').insert({
      creator: req.user.id,
      name: req.file.originalname,
      path: destination,
      type: mimeType,
    });

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


        this.db('documents').insert({
          content: data.toString('utf8'),
          encoding: 'utf8',
          filename: req.file.originalname,
          sha256: digest,
          owner: req.user.id
        }).then((insertedDocument) => {
          this.trainer.ingestDocument({
            content: data.toString('utf8'),
            encoding: 'utf8',
            filename: req.file.originalname,
            sha256: digest,
            owner: req.user.id
          }).then((ingestedDocument) => {
            res.send({ status: 'success', message: 'Successfully uploaded file!', path: destination });
          });
        });
      });
    });
  }
  catch (error) {
    console.log(error);
  }
};
