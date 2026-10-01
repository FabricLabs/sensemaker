'use strict';

const redisIndexForUser = (userId) => `sensemaker:owners:${userId}`;

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const rawId = req.params.id;
      const userId = req.user.id;
      const hasAdminAccess = await this._userHasAdminAccess(req);
      const globalIndexName = (this.trainer && this.trainer.settings && this.trainer.settings.redis && this.trainer.settings.redis.name) || 'sensemaker-embeddings';
      const globalPrefix = `doc:${globalIndexName}:`;
      const ownerPrefix = `doc:${redisIndexForUser(userId)}:`;

      try {
        let redisKey = null;
        if (rawId) {
          try {
            const decoded = Buffer.from(String(rawId), 'base64url').toString('utf8');
            if (decoded.startsWith('doc:')) redisKey = decoded;
          } catch (e) {
            redisKey = null;
          }
        }

        if (redisKey && this.trainer && typeof this.trainer.getMemoryFragmentByRedisKey === 'function') {
          if (!this.trainer.memoryRedisKeyAllowedForUser(redisKey, userId)) {
            return res.status(403).json({ error: 'Forbidden.' });
          }

          const fr = await this.trainer.getMemoryFragmentByRedisKey(redisKey);
          if (!fr) {
            return res.status(404).json({ error: 'Memory fragment not found.' });
          }

          const meta = fr.metadata || {};
          const onOwnerIndex = redisKey.startsWith(ownerPrefix);
          const onGlobal = redisKey.startsWith(globalPrefix);
          const allowed = onOwnerIndex
            || (onGlobal && (Number(meta.owner) === Number(userId) || hasAdminAccess));
          if (!allowed) {
            return res.status(403).json({ error: 'Forbidden.' });
          }

          const preview = typeof fr.content === 'string' ? fr.content.slice(0, 8000) : '';

          return res.json({
            kind: 'vector_fragment',
            memory: {
              id: rawId,
              redis_key: fr.redis_key,
              chunk_id: meta.chunk_id || null,
              chunk_index: meta.chunk_index,
              total_chunks: meta.total_chunks,
              embedding_model: meta.embedding_model || null
            },
            trace: {
              redis_key: fr.redis_key,
              redis_vector_index: onOwnerIndex ? redisIndexForUser(userId) : globalIndexName,
              parent_source_fabric_id: meta.parent_source_fabric_id || meta.fabric_id || null,
              file_id: meta.file_id || null,
              source_document_id: meta.source_document_id || null,
              owner_user_id: meta.owner != null ? meta.owner : null,
              has_embedding_vector: fr.has_vector
            },
            content_preview: preview,
            vector_resync_hint: fr.has_vector
              ? null
              : 'No vector field on this hash — re-run trainer ingestion for the source file or document.',
            model: {
              library: 'SQL documents/files remain authoritative; re-ingest rebuilds Redis memories and embeddings.'
            }
          });
        }

        let doc = null;
        if (rawId && /^\d+$/.test(String(rawId))) {
          doc = await this.db('documents')
            .where({ id: parseInt(rawId, 10) })
            .first();
        }
        if (!doc && rawId) {
          doc = await this.db('documents')
            .where({ fabric_id: String(rawId) })
            .first();
        }

        if (!doc) {
          return res.status(404).json({ error: 'Memory not found.' });
        }

        const allowed = doc.owner === userId || doc.creator === userId || hasAdminAccess;
        if (!allowed) {
          return res.status(403).json({ error: 'Forbidden.' });
        }

        const creator = doc.creator
          ? await this.db('users').select('username', 'display_name').where({ id: doc.creator }).first()
          : null;

        const previewSource = doc.plain_text || doc.content || doc.summary || '';
        const preview = typeof previewSource === 'string'
          ? previewSource.slice(0, 2000)
          : '';

        const hasRowEmbedding = !!doc.embedding_id;
        const vectorResyncHint = hasRowEmbedding
          ? 'Row links to embeddings.id; re-run ingestion if Redis vectors were removed.'
          : 'No document.embedding_id — agents can re-chunk into Redis memories via trainer.ingestDocument.';

        const indexUserId = doc.owner || doc.creator || userId;

        return res.json({
          kind: 'library_document',
          memory: {
            id: String(doc.id),
            fabric_id: doc.fabric_id,
            title: doc.title || 'Untitled Document',
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            status: doc.status,
            ingestion_status: doc.ingestion_status
          },
          trace: {
            document_id: doc.id,
            fabric_id: doc.fabric_id,
            embedding_id: doc.embedding_id,
            title_embedding_id: doc.title_embedding_id,
            redis_vector_index: redisIndexForUser(indexUserId),
            owner_user_id: doc.owner,
            creator_user_id: doc.creator,
            creator_username: creator ? creator.username : null,
            creator_display_name: creator ? creator.display_name : null
          },
          preview,
          vector_resync_hint: vectorResyncHint,
          model: {
            note: 'This is a library document row. Chunked memories live under Redis keys listed from GET /memories.'
          }
        });
      } catch (error) {
        console.error('[MEMORIES:VIEW]', error);
        return res.status(500).json({ error: 'Internal server error.' });
      }
    },
    html: () => {
      return res.send(this.applicationString);
    }
  });
};
