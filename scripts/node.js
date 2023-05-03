'use strict';

// Settings
const settings = require('../settings/local');

// Internal Service
const Sensemaker = require('../services/sensemaker');

async function main (input = {}) {
  // Create Node
  const sensemaker = new Sensemaker(input);

  // Start Node
  try {
    await sensemaker.start();
  } catch (exception) {
    console.error('Exception on start:', exception);
    process.exit();
  }

  // Return Node
  return sensemaker;
}

main(settings).catch((exception) => {
  console.error('[SENSEMAKER]', exception);
}).then((output) => {
  console.log('[SENSEMAKER]', 'Started!  Agent ID:', output.id);
});
