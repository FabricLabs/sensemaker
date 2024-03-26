'use strict';

// Settings
const settings = require('../settings/local');

// Dependencies
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

  // Main Training Loop
  console.log('[TRAINER]', '[MAIN]', 'Starting training process...');

  // Ingest all files
  for (let file of filesystem.files) {
    console.debug('[TRAINER]', '[MAIN]', '[FILE]', file);
    const start = new Date();
    try {
      const content = filesystem.readFile(file);
      const page = { content: content.toString('utf8') };
      const document = await trainer.ingestDocument({ content: content.toString('utf8'), metadata: content });
      const duration = new Date() - start;
      console.debug('[TRAINER]', '[MAIN]', `Ingested document in ${duration / 1000}s with result:`, document);
    } catch (exception) {
      console.error('error:', exception);
    }
  }

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
  console.log('[TRAINER]', '[OUTPUT]', output);
  output.trainer.stop();
});
