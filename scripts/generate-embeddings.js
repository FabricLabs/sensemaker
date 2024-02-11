'use strict';

const MAX_RECORD_COUNT = process.env.MAX_RECORD_COUNT || 500;

const settings = require('../settings/local');
const Jeeves = require('../services/jeeves');

async function main (settings = {}) {
  const jeeves = new Jeeves(settings);
  await jeeves.processData(MAX_RECORD_COUNT);

  return {
    id: jeeves.id
  };
}

main(settings).catch((exception) => {
  console.error('Exception:', exception);
}).then((result) => {
  console.log('Result:', result);
  process.exit();
});
