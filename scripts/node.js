'use strict';

const EventEmitter = require('events');
// Peer/noise streams attach many listeners per connection; default (10) triggers false-positive leak warnings.
EventEmitter.defaultMaxListeners = Math.max(EventEmitter.defaultMaxListeners || 10, 50);
process.setMaxListeners(EventEmitter.defaultMaxListeners);

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
  const fabricPort = Number(process.env.FABRIC_PORT);
  if (Number.isFinite(fabricPort) && fabricPort > 0) {
    config.port = fabricPort;
    if (config.fabric && typeof config.fabric === 'object') {
      config.fabric = Object.assign({}, config.fabric, { port: fabricPort });
    }
  }

  console.log('[SENSEMAKER]', `Ollama host: ${config.ollama?.host || 'undefined'}`);
  console.log('[SENSEMAKER]', `Ollama port: ${config.ollama?.port || 'undefined'}`);
  if (config.debug) {
    console.log('[SENSEMAKER]', `Debug setting: ${config.debug} (type: ${typeof config.debug})`);
  }

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

  let stopping = false;
  const shutdown = (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(`\n[SENSEMAKER] ${signal} received, shutting down...`);
    const hard = setTimeout(() => { process.exit(0); }, 3000).unref();
    sensemaker.stop().then(() => {
      clearTimeout(hard);
      process.exit(0);
    }).catch(() => process.exit(1));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

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
