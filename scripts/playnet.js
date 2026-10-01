'use strict';

const playnet = require('../contracts/playnet');
const settings = require('../settings/local');
const Node = require('@fabric/core/types/node');

async function main (input = {}) {
  const node = new Node(input);
  await node.start();
  return {
    id: node.id
  };
}

main(settings).catch((exception) => {
  console.error('[SCRIPTS:PLAYNET] Main Process Exception:', exception);
}).then((output) => {
  console.log('[SCRIPTS:PLAYNET] Main Process Output:', output);
});

