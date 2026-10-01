'use strict';

const settings = require('../settings/local');
const Sensemaker = require('../services/sensemaker');

let sensemaker = null;

// Handle messages from the main process
process.on('message', async (message) => {
  switch (message.type) {
    case 'start':
      try {
        sensemaker = new Sensemaker(settings);

        // Forward events to main process
        sensemaker.on('debug', (message) => {
          process.send({ type: 'debug', message });
        });

        sensemaker.on('log', (message) => {
          process.send({ type: 'log', message });
        });

        sensemaker.on('ready', () => {
          process.send({ type: 'ready' });
        });

        sensemaker.on('error', (error) => {
          process.send({ type: 'error', error: error.message });
        });

        await sensemaker.start();
        process.send({ type: 'started' });
      } catch (error) {
        process.send({ type: 'error', error: error.message });
      }
      break;

    case 'query':
      if (!sensemaker) {
        process.send({ type: 'error', error: 'Sensemaker not initialized', id: message.id });
        return;
      }
      try {
        const result = await sensemaker.query(message.query);
        process.send({ type: 'queryResult', result, id: message.id });
      } catch (error) {
        process.send({ type: 'error', error: error.message, id: message.id });
      }
      break;

    case 'stop':
      if (sensemaker) {
        try {
          await sensemaker.stop();
          process.send({ type: 'stopped' });
          sensemaker = null;
        } catch (error) {
          process.send({ type: 'error', error: error.message });
        }
      }
      break;
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  if (sensemaker) {
    try {
      await sensemaker.stop();
    } catch (error) {
      console.error('Error stopping Sensemaker:', error);
    }
  }
  process.exit();
});

process.on('SIGTERM', async () => {
  if (sensemaker) {
    try {
      await sensemaker.stop();
    } catch (error) {
      console.error('Error stopping Sensemaker:', error);
    }
  }
  process.exit();
});