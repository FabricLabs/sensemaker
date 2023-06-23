'use strict';

// Settings
const settings = require('../settings/local');

// Internal Service
const Jeeves = require('../services/jeeves');

// Contracts
const handleJeevesError = require('../contracts/handleJeevesError');

// Main Function
async function main (input = {}) {
  // Create Node
  const jeeves = new Jeeves(input);

  // Handlers
  jeeves.on('error', handleJeevesError);

  jeeves.on('debug', (debug) => {
    console.debug('[JEEVES]', '[DEBUG]', debug);
  });

  // Start Node
  try {
    await jeeves.start();
  } catch (exception) {
    console.error('Exception on start:', exception);
    process.exit();
  }

  // Bind
  process.on('SIGINT', jeeves.stop);
  process.on('SIGTERM', jeeves.stop);

  // Return Node
  return jeeves;
}

// Execute Main
main(settings).catch((exception) => {
  console.error('[JEEVES]', exception);
}).then((output) => {
  console.log('[JEEVES]', 'Started!  Agent ID:', output.id);
});
