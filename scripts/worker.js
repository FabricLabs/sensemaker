'use strict';

// Settings
const settings = require('../settings/local');

// Dependencies
const { createClient } = require('redis');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Message = require('@fabric/core/types/message');

// Jeeves
const Jeeves = require('../services/jeeves');

// Main Program
async function main (input = {}) {
  const actor = new Actor(input)
  const jeeves = new Jeeves(input);
  const redis = createClient(input.redis);

  // Start Jeeves
  await jeeves.start();

  redis.on('message', (channel, message) => {
    console.log('[REDIS]', 'Received message:', message);
  });

  return { id: actor.id, jeeves: jeeves };
}

// Execute Program
main(settings).catch((exception) => {
  console.error('error:', exception);
});
