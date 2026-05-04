'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const sources = await this.db('sources')
        .select('id', 'name', 'description', 'content', 'owner', 'status', 'recurrence', 'last_retrieved', 'latest_blob_id', 'blob_history', 'last_error', 'created_at', 'updated_at')
        .orderBy('updated_at', 'desc');

      console.debug('[SOURCES:LIST]', 'sources:', sources);

      const enhancedSources = sources.map(source => {
        return new Promise(async (resolve, reject) => {
          // Query documents by matching blob fabric_ids from source's history
          // Documents reference blobs via latest_blob_id (blob's fabric_id)
          // Source tracks all blob fabric_ids in blob_history
          let retrievalCount = { count: 0 };
          if (source.blob_history) {
            try {
              const blobHistory = JSON.parse(source.blob_history);
              if (blobHistory.length > 0) {
                // Find documents where latest_blob_id matches any blob from this source
                retrievalCount = await this.db('documents')
                  .whereIn('latest_blob_id', blobHistory)
                  .where('creator', null) // Source-created documents
                  .where('owner', null)
                  .count('id as count')
                  .first();
              }
            } catch (e) {
              console.error('[SOURCES:LIST]', 'Error parsing blob_history:', e);
            }
          } else if (source.latest_blob_id) {
            // Fallback: if no history, just check latest blob
            retrievalCount = await this.db('documents')
              .where('latest_blob_id', source.latest_blob_id)
              .where('creator', null)
              .where('owner', null)
              .count('id as count')
              .first();
          }
          console.debug('[SOURCES:LIST]', 'retrievalCount:', retrievalCount);

          // Get latest blob info using absolute fabric_id reference
          // source.latest_blob_id is the blob's fabric_id (deterministic from content via Actor)
          let latestBlob = null;
          if (source.latest_blob_id) {
            latestBlob = await this.db('blobs')
              .select('fabric_id', 'mime_type', 'created_at')
              .where('fabric_id', source.latest_blob_id)
              .first();
          }

          const enhanced = {
            ...source,
            retrieval_count: retrievalCount?.count || 0,
            has_retrievals: (retrievalCount?.count || 0) > 0,
            latest_blob: latestBlob
          };

          console.debug('[SOURCES:LIST]', 'enhanced:', enhanced);

          // Grant permissions
          if (enhanced.owner == req.user.fabric_id) {
            enhanced.can_edit = true;
          }

          resolve(enhanced);
        });
      });

      console.debug('starting to wait for enhancedSources');
      const enhancedSourcesResults = await Promise.all(enhancedSources);
      console.debug('enhancedSources:', enhancedSources);

      res.json(enhancedSourcesResults);
    }
  });
};
