'use strict';

const SETTINGS = {
  matrix: {
    alias: 'sensemaker',
    homeserver: 'https://fabric.pub',
    coordinator: '!pPjIUAOkwmgXeICrzT:fabric.pub',
    trigger: '!'
  }
};

// Services
const Chat = require('../services/chat');

async function main (input = {}) {
  const chat = new Chat({
    resources: {
      Chat: {
        description: 'Individual chat messages.',
        fields: [
          { name: 'author', required: true, type: 'String' },
          { name: 'content', required: true },
          { name: 'created', required: true },
          { name: 'sha256', required: true, type: 'String' },
          { name: 'signature', required: true, type: 'String' }
        ]
      },
      Room: {
        description: 'Groups of users sharing a message stream.',
        fields: [
          { name: 'created', required: true },
          { name: 'creator', required: true, type: 'String' },
          { name: 'messages', required: true, type: 'Collection' },
          { name: 'name', type: 'String', description: 'Human-friendly name for the room.' }
        ]
      }
    }
  });

  chat.on('log', (msg) => console.log(`[CHAT:LOG] ${msg}`));
  chat.on('debug', (msg) => console.debug(`[CHAT:DEBUG] ${msg}`));
  chat.on('error', (msg) => console.error(`[CHAT:ERROR] ${msg}`));
  chat.on('message', (msg) => console.log(`[CHAT:MESSAGE] ${msg}`));

  await chat.start();

  return {
    chat: chat.id
  };
}

main(SETTINGS).catch((exception) => {
  console.error('[CHAT]', 'Main Process Error:', exception);
}).then((output) => {
  console.log('[CHAT]', 'Main Process Cleanup:', output);
});
