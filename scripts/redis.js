'use strict';

const settings = require('../settings/local');
const { createClient } = require('redis');

async function main () {
  const client = createClient({
    password: settings.redis.password,
    socket: {
      host: settings.redis.host,
      port: settings.redis.port,
    }
  });
  
  client.connect();
  
  return {
    client: client
  };
}

main().then((result) => {
  console.log('Connected to Redis:', result.client);
}).catch((exception) => {
  console.error('Error connecting to Redis:', exception);
});
