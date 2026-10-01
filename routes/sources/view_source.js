'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const source = await this.db('sources').select('id', 'name', 'description', 'content', 'recurrence', 'last_retrieved', 'owner', 'latest_blob_id', 'blob_history', 'last_error', 'created_at', 'updated_at').where('id', req.params.id).first();

      if (!source) {
        return res.status(404).json({ error: 'Source not found' });
      }

      if (req.user.fabric_id == source.owner) source.can_edit = true;

      // Get retrieval history by matching blob fabric_ids from source's history
      // Documents reference blobs via latest_blob_id (blob's fabric_id - absolute reference)
      // Source tracks all blob fabric_ids in blob_history
      let historyDocuments = [];

      // Build list of blob IDs to search for
      const blobIdsToSearch = [];

      if (source.blob_history) {
        try {
          const blobHistory = JSON.parse(source.blob_history);
          if (Array.isArray(blobHistory) && blobHistory.length > 0) {
            blobIdsToSearch.push(...blobHistory);
          }
        } catch (e) {
          console.error('[SOURCES:VIEW]', 'Error parsing blob_history:', e);
        }
      }

      // Add latest_blob_id if not already in the list
      if (source.latest_blob_id && !blobIdsToSearch.includes(source.latest_blob_id)) {
        blobIdsToSearch.push(source.latest_blob_id);
      }

      // Query for documents matching any of these blob IDs
      if (blobIdsToSearch.length > 0) {
        historyDocuments = await this.db('documents')
          .select('id', 'fabric_id', 'title', 'summary', 'created_at', 'latest_blob_id', 'creator', 'owner')
          .whereIn('latest_blob_id', blobIdsToSearch)
          .orderBy('created_at', 'desc')
          .limit(20);
      }

      console.debug('[SOURCES:VIEW]', `Found ${historyDocuments.length} history documents for source ${source.id}`, {
        blob_ids_searched: blobIdsToSearch.length,
        blob_history: source.blob_history,
        latest_blob_id: source.latest_blob_id,
        last_retrieved: source.last_retrieved,
        documents_found: historyDocuments.map(d => ({ id: d.id, blob_id: d.latest_blob_id, created_at: d.created_at }))
      });

      // Get blob information for the latest retrieval using absolute fabric_id reference
      // source.latest_blob_id is the blob's fabric_id (absolute reference from Actor)
      let latestBlob = null;
      if (source.latest_blob_id) {
        // latest_blob_id is the blob's fabric_id (deterministic from content)
        latestBlob = await this.db('blobs')
          .select('fabric_id', 'mime_type', 'created_at')
          .where('fabric_id', source.latest_blob_id)
          .first();
      }

      // Build retrieval history
      const retrievalHistory = historyDocuments.map(doc => ({
        id: doc.id,
        fabric_id: doc.fabric_id,
        title: doc.title,
        summary: doc.summary,
        retrieved_at: doc.created_at,
        blob_id: doc.latest_blob_id
      }));

      const response = {
        ...source,
        latest_blob: latestBlob,
        retrieval_history: retrievalHistory,
        retrieval_count: retrievalHistory.length,
        has_retrievals: retrievalHistory.length > 0
      };

      res.json(response);
    }
  });
};
