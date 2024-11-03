'use strict';

// Import default (local) settings
const local = require('./local');

// Export custom settings
module.exports = Object.assign({}, local, {
  agents: {
    local: {
      // prompt: baseline.toString('utf8'),
      model: 'llama2',
      host: '127.0.0.1',
      port: 3045,
      secure: false,
      temperature: 0
    }
  }
});
