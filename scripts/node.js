'use strict';

// Settings
const settings = require('../settings/local');

// Internal Service
const Sensemaker = require('../services/sensemaker');

// Contracts
const handleSensemakerError = require('../contracts/handleSensemakerError');
const handleSensemakerLog = require('../contracts/handleSensemakerLog');
const handleSensemakerWarning = require('../contracts/handleSensemakerWarning');

// Main Function
async function main (input = {}) {
  // Create Node
  const start = new Date();
  const sensemaker = new Sensemaker(input);

  // Handlers
  sensemaker.on('error', handleSensemakerError);
  sensemaker.on('log', handleSensemakerLog);
  sensemaker.on('warning', handleSensemakerWarning);
  sensemaker.on('debug', (...debug) => {
    console.debug(`[${((new Date() - start) / 1000)}s]`, '[SENSEMAKER]', '[DEBUG]', ...debug);
  });

  // Start Node
  try {
    await sensemaker.start();
  } catch (exception) {
    console.error('Exception on start:', exception);
    process.exit();
  }

  // Bind
  process.on('SIGINT', sensemaker.stop);
  process.on('SIGTERM', sensemaker.stop);

  // Return Node
  return sensemaker;
}

// Execute Main
main(settings).catch((exception) => {
  console.error('[SENSEMAKER]', exception);
}).then((output) => {
  console.log('[SENSEMAKER]', 'Started!  Agent ID:', output.id);
});
