'use strict';

// Settings
const settings = require('../settings/local');

// Internal Service
const Jeeves = require('../services/jeeves');

async function main (input = {}) {
  // Create Node
  const jeeves = new Jeeves(input);

  // Start Node
  try {
    await jeeves.start();
  } catch (exception) {
    console.error('Exception on start:', exception);
    process.exit();
  }

  // Return Node
  return jeeves;
}

main(settings).catch((exception) => {
  console.error('[JEEVES]', exception);
}).then((output) => {
  console.log('[JEEVES]', 'Started!  Agent ID:', output.id);
});
