'use strict';

module.exports = async function IngestFile (...params) {
  console.debug('[NOVO]', '[INGEST]', 'Ingesting file...', params);
  console.trace('[NOVO]', '[INGEST]', 'Ingest context:', this);
  const file = await this.db('files').where('id', params[0]).first();
  const ingested = await this.trainer.ingestDocument({
    content: JSON.stringify(file),
    metadata: {
      id: file.id,
      owner: file.creator
    }
  }, 'file');

  console.debug('[NOVO]', '[INGEST]', 'Ingested file:', ingested);
  return { status: 'COMPLETED', ingested };
};
