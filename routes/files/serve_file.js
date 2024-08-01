'use strict';

const fs = require('fs');
const path = require('path');
const mime = require('mime-types'); // Ensure you have this package installed

module.exports = async function (req, res, next) {
  try {
    const fileId = req.params.id;
    const fileInfo = await this.db('files').where({id: fileId }).first();

    if (!fileInfo) {
      return res.status(404).send({ status: 'error', message: 'File not found or access denied.' });
    }

    const filePath = path.resolve(fileInfo.path);
    if (fs.existsSync(filePath)) {
      const mimeType = mime.lookup(filePath) || "application/octet-stream";

      // Attempt to set the Content-Disposition header to inline to force displaying in-browser
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);

      // Set the content type based on the file's MIME type
      res.contentType(mimeType);

      return res.sendFile(filePath);
    } else {
      return res.status(404).send({ status: 'error', message: 'File not found.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: 'error', message: 'Internal server error.' });
  }
};
