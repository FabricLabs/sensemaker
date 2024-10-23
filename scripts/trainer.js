'use strict';

// Constants
// TODO: import these from constants file
const ENABLE_FILESYSTEM_INGEST = false;
const ENABLE_DOCUMENT_INGEST = false;
const ENABLE_UPLOAD_INGEST = true;
const ENABLE_JURISDICTION_INGEST = false;
const ENABLE_COURT_INGEST = false;
const ENABLE_CASE_INGEST = true;

const {
  SYNC_EMBEDDINGS_COUNT
} = require('../constants');

// Settings
const settings = require('../settings/local');

// Dependencies
const fs = require('fs');
const knex = require('knex');
const Filesystem = require('@fabric/core/types/filesystem');

// Types
const Queue = require('../types/queue');
const Trainer = require('../types/trainer');

// Main Program
async function main (input = {}) {
  // Database
  const db = knex({
    client: 'mysql2',
    connection: input.db
  });

  // Fabric Filesystem
  const filesystem = new Filesystem(input.files);
  await filesystem.start();

  // Sensemaker
  const trainer = new Trainer(input);

  // Attach Database to Trainer
  trainer.attachDatabase(db);

  // Start Trainer
  await trainer.start();

  // Queue
  const queue = new Queue(input);

  // Main Training Loop
  console.log('[TRAINER]', '[MAIN]', 'Starting training process...');

  // Documents
  if (ENABLE_DOCUMENT_INGEST) {
    // TODO: filter documents by embedding status (only process documents lacking embeddings)
    const documentStream = db('documents').select('*').where('is_available', true).orderByRaw('RAND()').limit(SYNC_EMBEDDINGS_COUNT).stream();
    console.log('[TRAINER]', '[MAIN]', 'Documents:', documentStream);

    // for (let document of documents) {
    for await (const document of documentStream) {
      if (!document.plain_text) continue;
      const start = new Date();
      // const digest = crypto.createHash('sha256').update(content).digest('hex');
      const ingested = await trainer.ingestDocument({
        content: document.plain_text,
        encoding: 'utf8',
        // filename: req.file.originalname,
        // sha256: digest,
        title: document.title
      });

      const duration = new Date() - start;
      console.debug('[TRAINER]', '[MAIN]', `Ingested document in ${duration / 1000}s with result:`, ingested);
    }
  }

  // Ingest all files
  // TODO: subscribe to filesystem changes
  if (ENABLE_FILESYSTEM_INGEST) {
    for (let file of filesystem.files) {
      console.debug('[TRAINER]', '[MAIN]', '[FILE]', file);
      const start = new Date();
      try {
        const content = filesystem.readFile(file);
        const page = { title: file, content: content.toString('utf8') };
        const document = await trainer.ingestDocument({ content: page, metadata: { filename: file } });
        const duration = new Date() - start;
        console.debug('[TRAINER]', '[MAIN]', `Ingested filesystem document in ${duration / 1000}s with result:`, document);
      } catch (exception) {
        console.error('error:', exception);
      }
    }
  }

  if (ENABLE_UPLOAD_INGEST) {
    // TODO: warn about this loop on startup
    const uploadStream = db('files').select('*').whereNull('embedding_id').stream();
    for await (const file of uploadStream) {
      console.debug('[TRAINER]', '[MAIN]', '[UPLOAD]', 'Found upload without an embedding, ingesting now:', file);
      const start = new Date();
      try {
        const content = fs.readFileSync(file.path);
        const page = { title: file.name, content: content.toString('utf8') };
        const document = await trainer.ingestDocument({ content: JSON.stringify(page), metadata: { filename: file.name } });
        const duration = new Date() - start;
        console.debug('[TRAINER]', '[MAIN]', `Ingested uploaded document in ${duration / 1000}s with result:`, document);
      } catch (exception) {
        console.error('[TRAINER]', '[MAIN]', '[UPLOAD]', 'Error:', exception);
      }
    }
  }

  // Cleanup
  db.destroy();

  // Return results
  return {
    id: trainer.id,
    filesystem: filesystem,
    trainer: trainer
  };
}

// Execute Program
main(settings).catch((exception) => {
  console.error('[TRAINER]', '[EXCEPTION]', exception);
}).then((output) => {
  console.log('[TRAINER]', '[OUTPUT]', { ...output, trainer: undefined });
  // output.trainer.stop();
});
