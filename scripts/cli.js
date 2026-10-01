'use strict';

const settings = require('../settings/local');
const CLI = require('../types/cli');

async function main (input = {}) {
  const cli = new CLI(input);
  await cli.start();
  return {
    cli: cli
  };
}

main(settings).catch((error) => {
  console.error('[SENSEMAKER:CLI]', '[ERROR]', error);
}).then((output) => {
  console.log('[SENSEMAKER:CLI]', '[READY]', output);
});
