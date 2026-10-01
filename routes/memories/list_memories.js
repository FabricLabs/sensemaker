'use strict';

const Actor = require('@fabric/core/types/actor');

const MEMORIES_SCAN_MS = parseInt(process.env.SENSEMAKER_MEMORIES_SCAN_MS || '15000', 10);

async function raceScan (promise, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), MEMORIES_SCAN_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Memories are Redis vector rows (document fragments after trainer chunking), each with
 * embeddings and metadata linking back to the library (files/documents). The SQL document
 * store is the canonical library; agents re-ingest when they discover missing vectors.
 */
module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ memories: [], error: 'Authentication required.' });
      }

      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit, 10) || 500, 5000);
      const includeGlobal = req.query.include_global === '1' || req.query.include_global === 'true';
      const globalIndexName = (this.trainer && this.trainer.settings && this.trainer.settings.redis && this.trainer.settings.redis.name) || 'sensemaker-embeddings';

      try {
        if (!this.trainer || typeof this.trainer.listMemoryFragmentsForOwner !== 'function') {
          return res.status(503).json({
            memories: [],
            error: 'Trainer memory listing unavailable.',
            model: memoryModelHelp(globalIndexName)
          });
        }

        let ownerFragments = [];
        let degraded = false;
        let scanTimedOut = false;
        try {
          const r = await raceScan(
            this.trainer.listMemoryFragmentsForOwner(userId, { limit }),
            'MEMORIES_OWNER'
          );
          ownerFragments = r.fragments || [];
          degraded = !!r.degraded;
        } catch (e) {
          if (e && e.message === 'MEMORIES_OWNER_TIMEOUT') {
            scanTimedOut = true;
            degraded = true;
            console.warn('[MEMORIES:LIST] Owner Redis scan timed out after', MEMORIES_SCAN_MS, 'ms');
          } else {
            throw e;
          }
        }

        let allFragments = ownerFragments.slice();
        const seen = new Set(allFragments.map((f) => f.redis_key));

        if (includeGlobal) {
          let globalFragments = [];
          try {
            const g = await raceScan(
              this.trainer.listMemoryFragmentsFromIndex(globalIndexName, {
                limit,
                ownerFilterUserId: userId
              }),
              'MEMORIES_GLOBAL'
            );
            globalFragments = g.fragments || [];
            degraded = degraded || !!g.degraded;
          } catch (e) {
            if (e && e.message === 'MEMORIES_GLOBAL_TIMEOUT') {
              scanTimedOut = true;
              degraded = true;
              console.warn('[MEMORIES:LIST] Global Redis scan timed out after', MEMORIES_SCAN_MS, 'ms');
            } else {
              throw e;
            }
          }
          for (const fr of globalFragments) {
            if (!seen.has(fr.redis_key)) {
              seen.add(fr.redis_key);
              allFragments.push(fr);
            }
          }
        }

        allFragments.sort((a, b) => {
          const ta = a.metadata.created_at || '';
          const tb = b.metadata.created_at || '';
          return tb.localeCompare(ta);
        });

        const fileIds = [...new Set(allFragments.map((f) => f.metadata.file_id).filter(Boolean))];
        const filesById = {};
        if (fileIds.length) {
          const files = await this.db('files').select('id', 'name', 'fabric_id').whereIn('id', fileIds);
          files.forEach((f) => { filesById[f.id] = f; });
        }

        const docIds = [...new Set(allFragments.map((f) => f.metadata.source_document_id).filter(Boolean))];
        const docsById = {};
        if (docIds.length) {
          const docs = await this.db('documents').select('id', 'title', 'fabric_id').whereIn('id', docIds);
          docs.forEach((d) => { docsById[d.id] = d; });
        }

        const memories = allFragments.map((fr) => {
          const meta = fr.metadata || {};
          const file = meta.file_id ? filesById[meta.file_id] : null;
          const doc = meta.source_document_id ? docsById[meta.source_document_id] : null;
          const fragmentActor = new Actor({
            type: 'MemoryFragment',
            redis_key: fr.redis_key
          });

          const total = meta.total_chunks != null ? meta.total_chunks : '?';
          const idx = meta.chunk_index != null ? meta.chunk_index + 1 : '?';
          const baseTitle = file ? file.name : (doc ? doc.title : (meta.filename || 'Memory fragment'));
          const title = `${baseTitle} — part ${idx}/${total}`;

          const memoryId = Buffer.from(fr.redis_key, 'utf8').toString('base64url');

          return {
            id: memoryId,
            title,
            created_at: meta.created_at || null,
            creator_name: 'you',
            kind: 'vector_fragment',
            trace: {
              redis_key: fr.redis_key,
              fragment_fabric_id: fragmentActor.id,
              parent_source_fabric_id: meta.parent_source_fabric_id || meta.fabric_id || null,
              chunk_id: meta.chunk_id || null,
              chunk_index: meta.chunk_index,
              total_chunks: meta.total_chunks,
              embedding_model: meta.embedding_model || null,
              owner_user_id: meta.owner != null ? meta.owner : null,
              file_id: meta.file_id || null,
              file_fabric_id: file ? file.fabric_id : null,
              source_document_id: meta.source_document_id || null,
              document_fabric_id: doc ? doc.fabric_id : null,
              library_note: 'Row in files/documents is the library source; this Redis entry is the retrievable memory + embedding.'
            },
            has_embedding_vector: fr.has_vector,
            embedding_model_pending: !meta.embedding_model
          };
        });

        return res.json({
          memories,
          degraded: degraded || false,
          scan_timed_out: scanTimedOut,
          model: memoryModelHelp(globalIndexName)
        });
      } catch (error) {
        console.error('[MEMORIES:LIST]', error);
        return res.status(500).json({ memories: [], error: 'Internal server error.' });
      }
    },
    html: () => {
      return res.send(this.applicationString);
    }
  });
};

function memoryModelHelp (globalIndexName) {
  return {
    memory: 'One Redis vector hash per chunk (fragment text + metadata + embedding).',
    library: 'Documents/files in SQL are iterated by agents; missing embeddings are filled by background ingestion when discovered.',
    owner_index: 'sensemaker:owners:{userId}',
    global_index: globalIndexName,
    multi_model: 'chunk metadata.embedding_model records which model produced the vector; re-ingest with a new model adds new rows (older rows may remain until pruned).'
  };
}
