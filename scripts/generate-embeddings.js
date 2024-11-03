'use strict';

const MAX_RECORD_COUNT = process.env.MAX_RECORD_COUNT || 500;

const settings = require('../settings/local');
const Sensemaker = require('../services/sensemaker');

async function main (settings = {}) {
  const sensemaker = new Sensemaker(settings);
  await sensemaker.processData(MAX_RECORD_COUNT);

  return {
    id: sensemaker.id
  };
}

main(settings).catch((exception) => {
  console.error('Exception:', exception);
}).then((result) => {
  console.log('Result:', result);
  process.exit();
});
