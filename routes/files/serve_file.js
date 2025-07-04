'use strict';

const mime = require('mime-types');

module.exports = async function (req, res, next) {
  try {
    const fileId = req.params.id;
    const fileInfo = await this.db('files').where({ id: fileId }).first();

    if (!fileInfo) {
      return res.status(404).send({ status: 'error', message: 'File not found or access denied.' });
    }

    // Get the file content from the blobs table instead of filesystem
    let blob;
    if (fileInfo.preimage_sha256) {
      blob = await this.db('blobs').where('preimage_sha256', fileInfo.preimage_sha256).first();
    } else if (fileInfo.blob_id) {
      blob = await this.db('blobs').where('fabric_id', fileInfo.blob_id).first();
    }

    if (!blob) {
      return res.status(404).send({ status: 'error', message: 'File content not found in database.' });
    }

    // Determine MIME type from file info or blob
    const mimeType = fileInfo.type || blob.mime_type || mime.lookup(fileInfo.name) || "application/octet-stream";

    // Set headers for inline display
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.name}"`);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', blob.content.length);

    // Send the blob content
    return res.send(blob.content);
  } catch (error) {
    console.error('[SERVE_FILE] Error serving file:', error);
    return res.status(500).send({ status: 'error', message: 'Internal server error.' });
  }
};
