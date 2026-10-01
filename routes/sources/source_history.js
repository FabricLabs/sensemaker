'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const source = await this.db('sources')
        .select('id', 'latest_blob_id', 'blob_history', 'last_retrieved')
        .where('id', req.params.id)
        .first();

      if (!source) {
        return res.status(404).json({ error: 'Source not found' });
      }

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
          console.error('[SOURCES:HISTORY]', 'Error parsing blob_history:', e);
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
          .orderBy('created_at', 'asc') // Order ascending to calculate changes correctly
          .limit(20);
      }

      console.debug('[SOURCES:HISTORY]', `Found ${historyDocuments.length} history documents for source ${source.id}`, {
        blob_ids_searched: blobIdsToSearch.length,
        blob_history: source.blob_history,
        latest_blob_id: source.latest_blob_id,
        last_retrieved: source.last_retrieved
      });

      // Get blob sizes for all blob IDs
      const blobSizes = {};
      if (blobIdsToSearch.length > 0) {
        const blobs = await this.db('blobs')
          .select('fabric_id', 'content')
          .whereIn('fabric_id', blobIdsToSearch);

        for (const blob of blobs) {
          // Calculate size: for LONGBLOB, use Buffer.byteLength or content length
          const size = Buffer.isBuffer(blob.content)
            ? blob.content.length
            : (typeof blob.content === 'string' ? Buffer.byteLength(blob.content, 'utf8') : 0);
          blobSizes[blob.fabric_id] = size;
        }
      }

      // Build retrieval history as JSON array with bytes changed
      const retrievalHistory = historyDocuments.map((doc, index) => {
        const currentBlobSize = blobSizes[doc.latest_blob_id] || 0;
        let bytesChanged = null;

        // Calculate bytes changed from previous retrieval
        if (index > 0) {
          const previousDoc = historyDocuments[index - 1];
          const previousBlobSize = blobSizes[previousDoc.latest_blob_id] || 0;
          bytesChanged = currentBlobSize - previousBlobSize;
        }

        return {
          id: doc.id,
          fabric_id: doc.fabric_id,
          title: doc.title,
          summary: doc.summary,
          retrieved_at: doc.created_at,
          blob_id: doc.latest_blob_id,
          blob_size: currentBlobSize,
          bytes_changed: bytesChanged
        };
      });

      // Reverse to show newest first
      res.json(retrievalHistory.reverse());
    }
  });
};

