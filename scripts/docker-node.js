'use strict';

// Docker-specific settings
const settings = require('../settings/docker');

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
  console.log('[DOCKER]', 'Starting Sensemaker in Docker mode...');
  
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
    console.log('[DOCKER]', 'Attempting to start Sensemaker...');
    await sensemaker.start();
    console.log('[DOCKER]', 'Sensemaker started successfully!');
  } catch (exception) {
    console.error('[DOCKER]', 'Exception on start:', exception);
    process.exit(1);
  }

  // Bind signal handlers with proper context
  process.on('SIGINT', async () => {
    console.log('[DOCKER]', 'Received SIGINT, shutting down gracefully...');
    await sensemaker.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('[DOCKER]', 'Received SIGTERM, shutting down gracefully...');
    await sensemaker.stop();
    process.exit(0);
  });

  // Return Node
  return sensemaker;
}

// Execute Main
main(settings).catch((exception) => {
  console.error('[DOCKER]', 'Fatal error:', exception);
  process.exit(1);
}).then((output) => {
  if (!output || !output.id) {
    console.error('[DOCKER]', 'Failed to initialize properly');
    process.exit(1);
  }
  console.log('[DOCKER]', 'Sensemaker ready! Agent ID:', output.id);
  console.log('[DOCKER]', 'Web interface available at http://localhost:3040');
});