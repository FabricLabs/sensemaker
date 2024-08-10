'use strict';

const { StatuteProvider } = require('../libraries/statute-scraper');

async function main () {
  const provider = new StatuteProvider();
  await provider.start();

  return {
    id: provider.id
  };
}

main().catch((exception) => {
  console.error('Error:', exception);
}).then((output) => {
  console.log('Output:', output);
});
