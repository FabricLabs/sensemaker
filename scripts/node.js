'use strict';

const settings = require('../settings/default');
const Sensemaker = require('../types/sensemaker');

// Environment
// TODO: re-evaluate, remove
const Environment = require('@fabric/core/types/environment');
const environment = new Environment();

async function main (input = '') {
  // Read Environment
  environment.start();

  // Load Service
  const sensemaker = new Sensemaker(settings);
  const process = await sensemaker.start();

  sensemaker.on('info', function (info) {
    console.log('[INFO:SENSEMAKER]', info);
  });

  process.on('ready', function () {
    console.log('[SENSEMAKER]', 'process claimed ready!');
  });

  console.log('[SENSEMAKER]', 'process', process);
  console.log('[SENSEMAKER]', 'started!');

  return process;
}

main().catch((exception) => {
  console.error('[SENSEMAKER]', exception);
}).then((output) => {
  console.log('[SENSEMAKER]', 'Output:', output);
});
