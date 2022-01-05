'use strict';

const merge = require('lodash.merge');
const defaults = require('../settings/default');
const settings = require('../settings/local');

const Sensemaker = require('../services/sensemaker');
const Node = require('@fabric/core/types/node');

async function main (input = {}) {
  // Create Node
  const sensemaker = new Node({
    service: Sensemaker,
    settings: input
  });

  // Start Node
  await sensemaker.start();

  // Return Node
  return sensemaker;
}

main(settings).catch((exception) => {
  console.error('[SENSEMAKER]', exception);
}).then((output) => {
  console.log('[SENSEMAKER]', 'Started!  Agent ID:', output.id);
});
