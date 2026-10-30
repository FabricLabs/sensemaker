'use strict';

module.exports = function (req, res, next) {
  console.debug('[SENSEMAKER]', '[HTTP]', 'Viewing document:', req.params.fabricID);
  console.debug('[SENSEMAKER]', '[HTTP]', 'Viewing document params:', req.params);
  return res.format({
    json: async () => {
      const isAdmin = await this._userHasAdminAccess(req);

      const userId = req.user && req.user.id;
      let query = this.db('documents')
        .select('fabric_id as id', 'title', 'created_at', 'updated_at', 'fabric_type', 'mime_type', 'content', 'history', 'latest_blob_id', 'summary', 'pinned', 'folders', 'creator', 'owner')
        .where('fabric_id', req.params.fabricID)
        .andWhere('status', '!=', 'deleted');

      // If not admin, restrict to documents where user is creator/owner or document is source-created
      if (!isAdmin) {
        query = query.andWhere(function () {
          // Source-created documents (no creator, no owner) are visible to all.
          this.where(function () {
            this.whereNull('creator').whereNull('owner');
          });
          if (userId) {
            this.orWhere('creator', '=', userId)
              .orWhere('owner', '=', userId);
          }
        });
      }

      const document = await query.orderBy('created_at', 'desc').first();
      if (!document) return res.status(404).send({ status: 'error', message: 'Document not found.' });
      res.send(document);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
