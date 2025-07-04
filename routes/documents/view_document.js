'use strict';

module.exports = function (req, res, next) {
  console.debug('[SENSEMAKER]', '[HTTP]', 'Viewing document:', req.params.fabricID);
  console.debug('[SENSEMAKER]', '[HTTP]', 'Viewing document params:', req.params);
  return res.format({
    json: async () => {
      const document = await this.db('documents')
        .select('fabric_id as id', 'title', 'created_at', 'updated_at', 'fabric_type', 'mime_type', 'content', 'history', 'latest_blob_id', 'summary', 'pinned', 'folders')
        .where('fabric_id', req.params.fabricID)
        .andWhere('status', '!=', 'deleted')
        .andWhere(function() {
          this.where('creator', '=', req.user.id).orWhere('owner', '=', req.user.id);
        })
        .orderBy('created_at', 'desc')
        .first();
      if (!document) return res.status(404).send({ status: 'error', message: 'Document not found.' });
      res.send(document);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
