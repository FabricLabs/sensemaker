#!/usr/bin/env node
'use strict';

// Settings
const settings = require('../settings/local');

// Dependencies
const StatuteProvider = require('../services/StatuteProvider');

// # Node Scraper for Jeeves
// Consumes [] and produces [].
async function main (input = {}) {
  const provider = new StatuteProvider(input);

  provider.on('debug', (message) => {
    console.log('[STATUTES]', '[DEBUG]', message);
  });

  provider.on('message', (message) => {
    console.log('[STATUTES]', '[MESSAGE]', message);
  });

  provider.on('statute', (statute) => {
    console.log('[STATUTES]', '[STATUTE]', statute);
    // TODO: emit statute from provider
  });

  await provider.start()

  return {
    id: provider.id
  };
}

// Run as script
main(settings).catch((exception) => {
  console.error('[STATUTES]', 'Could not start:', exception);
}).then((result) => {
  console.log('[STATUTES]', 'Main Process ready:', result);
});
