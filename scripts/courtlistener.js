'use strict';

const input = require('../settings/local');
const CourtListener = require('../services/courtlistener'); 

async function main (settings = {}) {
  const courtlistener = new CourtListener(settings);

  courtlistener.on('debug', (...debug) => {
    console.debug('[JEEVES:COURTLISTENER]', '[DEBUG]', ...debug);
  });

  courtlistener.on('error', (...message) => {
    console.error('[JEEVES:COURTLISTENER]', '[ERROR]', ...message);
  });

  courtlistener.on('warning', (...warning) => {
    console.warn('[JEEVES:COURTLISTENER]', '[WARNING]', ...warning);
  });

  courtlistener.on('message', (message) => {
    console.log('[JEEVES:COURTLISTENER]', '[MESSAGE]', message);
  });

  await courtlistener.start();
}

main(input.courtlistener).catch((exception) => {
  console.error('[JEEVES:BROWSER]', 'Error in main():', exception);
  process.exit(1);
}).then((output) => {
  console.debug('[JEEVES:BROWSER]', 'output:', output);
});
