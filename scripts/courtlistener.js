'use strict';

const {
  fetchFromAPI
} = require('./apiActions');

const input = require('../settings/local');

async function main (settings = {}) {
  const courtlistener = new CourtListener(settings);

  courtlistener.on('debug', (message) => {
    console.debug('[JEEVES:COURTLISTENER]', message);
  });

  await courtlistener.start();
}

main(input.courtlistener).catch((exception) => {
  console.error('[JEEVES:BROWSER]', 'Error in main():', exception);
  process.exit(1);
}).then((output) => {
  console.debug('[JEEVES:BROWSER]', 'output:', output);
});
