'use strict';

const merge = require('lodash.merge');
const defaults = require('../settings/default');
const settings = require('../settings/local.json');
const Sensemaker = require('../types/sensemaker');

// Environment
// TODO: re-evaluate, remove
const Environment = require('@fabric/core/types/environment');
const environment = new Environment();

const input = merge({
  seed: environment.readVariable('FABRIC_SEED')
}, defaults, settings);

async function main (input = {}) {
  // Read Environment
  environment.start();

  // Load Service
  const sensemaker = new Sensemaker(input);
  const process = await sensemaker.start();

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

  process.on('ready', function () {
    console.log('[SENSEMAKER]', 'process claimed ready!');
  });

  return process.id;
}

main(input).catch((exception) => {
  console.error('[SENSEMAKER]', exception);
}).then((output) => {
  console.log('[SENSEMAKER]', 'Started!  Agent ID:', output);
});