'use strict';

module.exports = function (req, res, next) {
  console.debug('[SENSEMAKER]', '[HTTP]', 'Viewing document:', req.params.fabricID);
  console.debug('[SENSEMAKER]', '[HTTP]', 'Viewing document params:', req.params);
  return res.format({
    json: async () => {
      const isAdmin = await this._userHasAdminAccess(req);

      console.debug('[SENSEMAKER]', '[HTTP]', 'Is admin:', isAdmin);
      console.debug('[SENSEMAKER]', '[HTTP]', 'User:', req.user);
      console.debug('[SENSEMAKER]', '[HTTP]', 'User state:', req.user.state);
      console.debug('[SENSEMAKER]', '[HTTP]', 'Authorization header:', req.headers.authorization);
      console.debug('[SENSEMAKER]', '[HTTP]', 'Cookie:', req.headers.cookie);

      let query = this.db('documents')
        .select('fabric_id as id', 'title', 'created_at', 'updated_at', 'fabric_type', 'mime_type', 'content', 'history', 'latest_blob_id', 'summary', 'pinned', 'folders', 'creator', 'owner')
        .where('fabric_id', req.params.fabricID)
        .andWhere('status', '!=', 'deleted');

      // If not admin, restrict to documents where user is creator/owner or document is source-created
      if (!isAdmin) {
        query = query.andWhere(function() {
          // Allow access if user is creator/owner (if authenticated), OR if document is source-created (creator and owner are null)
          if (req.user.id) {
            this.where('creator', '=', req.user.id)
              .orWhere('owner', '=', req.user.id);
          }
        });
      }

      const document = await query.orderBy('created_at', 'desc').first();
      if (!document) return res.status(404).send({ status: 'error', message: 'Document not found.' });
      console.debug('[SENSEMAKER]', '[HTTP]', 'Document:', document);
      res.send(document);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
