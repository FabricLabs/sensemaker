'use strict';

// Dependencies
const { createClient } = require('redis');
const merge = require('lodash.merge');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Message = require('@fabric/core/types/message');

// Jeeves
const Jeeves = require('../services/jeeves');

// Settings
const settings = merge({}, require('../settings/local'), {
  http: {
    listen: false // Worker does not need to listen for HTTP traffic
  }
});

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
