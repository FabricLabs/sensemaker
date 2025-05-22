'use strict';

// Settings
const settings = require('../settings/local');

// Internal Service
const Sensemaker = require('../services/sensemaker');

// Contracts
const handleSensemakerError = require('../functions/handleSensemakerError');
const handleSensemakerLog = require('../functions/handleSensemakerLog');
const handleSensemakerWarning = require('../functions/handleSensemakerWarning');

// Load key material from environment
const keySettings = {
  seed: process.env.FABRIC_SEED,
  xprv: process.env.FABRIC_XPRV,
  xpub: process.env.FABRIC_XPUB,
  passphrase: process.env.FABRIC_PASSPHRASE
};

// Main Function
async function main (input = {}) {
  // Merge settings with key material
  const config = {
    ...input,
    ...keySettings
  };

  // Create Node
  const start = new Date();
  const sensemaker = new Sensemaker(config);

  // Handlers
  sensemaker.on('error', handleSensemakerError);
  sensemaker.on('log', handleSensemakerLog);
  sensemaker.on('warning', handleSensemakerWarning);
  if (config.debug) sensemaker.on('debug', (...debug) => { console.debug(`[${((new Date() - start) / 1000)}s]`, '[SENSEMAKER]', '[DEBUG]', ...debug); });

  // Start Node
  try {
    await sensemaker.start();
  } catch (exception) {
    console.error('[SENSEMAKER]', 'Exception on start:', exception);
    process.exit(1);
  }

  // Bind signal handlers with proper context
  process.on('SIGINT', () => sensemaker.stop());
  process.on('SIGTERM', () => sensemaker.stop());

  // Return Node
  return sensemaker;
}

// Execute Main
main(settings).catch((exception) => {
  console.error('[SENSEMAKER]', exception);
  process.exit(1);
}).then((output) => {
  if (!output || !output.id) {
    console.error('[SENSEMAKER]', 'Failed to initialize properly');
    process.exit(1);
  }
  console.log('[SENSEMAKER]', 'Started!  Agent ID:', output.id);
});
