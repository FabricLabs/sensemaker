'use strict';

const merge = require('lodash.merge');
const defaults = require('../settings/default');
const settings = require('../settings/local.json');
const Sensemaker = require('../services/sensemaker');

// Environment
// TODO: re-evaluate, remove
const Environment = require('@fabric/core/types/environment');
const environment = new Environment();

const input = merge({
  debug: (!environment.readVariable('DEBUG')),
  seed: environment.readVariable('FABRIC_SEED')
}, defaults, settings);

async function main (input = {}) {
  // Read Environment
  environment.start();

  // Load Service
  const sensemaker = new Sensemaker(input);
  await sensemaker.start();

  sensemaker.on('debug', function (debug) {
    if (input.debug) console.debug('[SENSEMAKER:DEBUG]', debug);
  });

  sensemaker.on('info', function (info) {
    console.log('[SENSEMAKER:INFO]', info);
  });

  sensemaker.on('log', function (log) {
    console.log('[SENSEMAKER:LOG]', log);
  });

  sensemaker.on('warning', function (warn) {
    console.warn('[SENSEMAKER:LOG]', warn);
  });

  sensemaker.on('error', function (error) {
    console.error('[SENSEMAKER:LOG]', error);
  });

  sensemaker.on('message', function (msg) {
    console.log('[FABRIC:MESSAGE]', msg);
  });

  sensemaker.on('ready', function () {
    console.log('[SENSEMAKER]', 'Claimed ready!');
  });

  return sensemaker.id;
}

main(input).catch((exception) => {
  console.error('[SENSEMAKER]', exception);
}).then((output) => {
  console.log('[SENSEMAKER]', 'Started!  Agent ID:', output);
});
