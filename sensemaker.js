'use strict';

const settings = require('./settings');
const Sensemaker = require('./types/sensemaker');

async function main () {
  let sensemaker = new Sensemaker(settings);
  let process = await sensemaker.start();

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

main();
