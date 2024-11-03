'use strict';

// Dependencies
const { createClient } = require('redis');
const merge = require('lodash.merge');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Message = require('@fabric/core/types/message');

// Sensemaker
const Sensemaker = require('../services/sensemaker');

// Settings
const settings = merge({}, require('../settings/local'), {
  frequency: 1,
  http: {
    listen: false // Worker does not need to listen for HTTP traffic
  }
});

// Main Program
async function main (input = {}) {
  const actor = new Actor(input)
  const sensemaker = new Sensemaker(input);
  const redis = createClient(input.redis);

  // Start Sensemaker
  await sensemaker.start();

  redis.on('message', (channel, message) => {
    console.log('[REDIS]', 'Received message:', message);
  });

  return { id: actor.id, sensemaker: sensemaker };
}

// Execute Program
main(settings).catch((exception) => {
  console.error('error:', exception);
});
