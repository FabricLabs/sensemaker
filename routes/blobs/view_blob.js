'use strict';

module.exports = async function (req, res, next) {
  try {
    const blob = await this.db('blobs').where('fabric_id', req.params.id).first();
    if (!blob) return res.status(404).send('Blob not found');

    console.debug('[BLOBS:VIEW] Serving blob:', {
      fabric_id: req.params.id,
      mime_type: blob.mime_type,
      contentType: typeof blob.content,
      isBuffer: Buffer.isBuffer(blob.content),
      contentLength: blob.content ? blob.content.length : 0,
      firstBytes: blob.content ? Array.from(blob.content.slice(0, 16)) : [],
      isValidPNG: blob.content && blob.content.length > 8 ?
        [blob.content[0], blob.content[1], blob.content[2], blob.content[3]] : null
    });

    // Set appropriate headers for the blob
    const mimeType = blob.mime_type || 'application/octet-stream';
    res.set('Content-Type', mimeType);

    // For images, set additional headers
    if (mimeType.startsWith('image/')) {
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.set('Access-Control-Allow-Origin', '*'); // Allow cross-origin access
    }

    // Handle binary vs text content appropriately
    if (Buffer.isBuffer(blob.content)) {
      // Content is already a buffer (binary data) - serve it directly
      console.debug('[BLOBS:VIEW] Sending buffer content, size:', blob.content.length);
      res.send(blob.content);
    } else if (typeof blob.content === 'string') {
      // Content is a string
      console.debug('[BLOBS:VIEW] Sending string content, length:', blob.content.length);
      res.send(blob.content);
    } else {
      console.error('[BLOBS:VIEW] Unknown content type:', typeof blob.content);
      res.status(500).send('Invalid blob content format');
    }
  } catch (error) {
    console.error('[BLOBS:VIEW] Error serving blob:', error);
    res.status(500).send('Internal server error');
  }
};
