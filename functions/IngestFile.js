'use strict';

module.exports = async (...params) => {
  console.debug('[NOVO]', '[QUEUE]', 'Ingesting file...', params);
  const file = await this.db('files').where('id', params[0]).first();
  const ingested = await this.trainer.ingestDocument({ content: JSON.stringify(file), metadata: { id: file.id }}, 'file');
  return { status: 'COMPLETED', ingested };
};
