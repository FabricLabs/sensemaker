'use strict';

// Constants
const ENABLE_FILESYSTEM_INGEST = false;
const ENABLE_DOCUMENT_INGEST = true;
const ENABLE_JURISDICTION_INGEST = true;

// Settings
const settings = require('../settings/local');

// Dependencies
const knex = require('knex');
const Filesystem = require('@fabric/core/types/filesystem');

// Types
const Trainer = require('../types/trainer');

// Main Program
async function main (input = {}) {
  // Fabric Filesystem
  const filesystem = new Filesystem(settings.files);
  await filesystem.start();

  // Sensemaker
  const trainer = new Trainer(input);
  await trainer.start();

  // Database
  const db = knex({
    client: 'mysql2',
    connection: input.db
  });

  // Main Training Loop
  console.log('[TRAINER]', '[MAIN]', 'Starting training process...');

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

  if (ENABLE_JURISDICTION_INGEST) {
    const jurisdictionStream = db('jurisdictions').select('*').stream();
    for await (const jurisdiction of jurisdictionStream) {
      const start = new Date();
      // TODO: consider using authority or domain instead of simply "novo" to enable cross-host training
      const actor = { name: `novo/jurisdictions/${jurisdiction.id}` }; // Novo reference ID (name)
      const title = { name: `novo/jurisdictions/${jurisdiction.id}/name`, content: jurisdiction.name };
      const reference = await trainer.ingestDocument({ content: JSON.stringify(actor), metadata: actor }, 'actor');
      const embedding = await trainer.ingestDocument({ content: JSON.stringify(title), metadata: title }, 'title');
      const ingested = await trainer.ingestDocument({ content: JSON.stringify(jurisdiction), metadata: jurisdiction }, 'jurisdiction');
      const duration = new Date() - start;
      console.debug('[TRAINER]', '[MAIN]', `Ingested jurisdiction in ${duration / 1000}s with result:`, ingested);
    }
  }

  // Documents
  if (ENABLE_DOCUMENT_INGEST) {
    // const documents = await db('documents').select('*').where('is_available', true).orderByRaw('RAND()').limit(100);
    const documentStream = db('documents').select('*').where('is_available', true).orderByRaw('RAND()').stream();
    // console.log('[TRAINER]', '[MAIN]', 'Documents:', documents);
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

  // Cases
  // Courts
  // Jurisdictions
  // Reporters
  // Volumes

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
