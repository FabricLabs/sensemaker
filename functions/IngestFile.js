'use strict';

module.exports = async function IngestFile (...params) {
  console.debug('[INGEST]', 'Ingesting file...', params);
  const file = await this.db('files').where('id', params[0]).first();
  const ingested = await this.trainer.ingestDocument({
    content: JSON.stringify(file),
    metadata: {
      id: file.id,
      owner: file.creator
    }
  }, 'file');
  console.debug('[INGEST]', 'Ingested file:', ingested);

  // TODO: check for error
  const insertedEmbedding = await this.db('embeddings').insert({
    content: JSON.stringify(ingested.content),
  });
  console.debug('[INGEST]', 'Inserted embedding:', insertedEmbedding);

  // TODO: check for error
  await this.db('files').where('id', file.id).update({
    embedding_id: insertedEmbedding[0],
    status: 'ingested'
  });

  return { status: 'COMPLETED', ingested };
};
