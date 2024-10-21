'use strict';

const Clock = require('../types/clock');

async function OP_CREATE_WALLET (wallet) {
  return {
    keys: []
  };
}

async function OP_HANDLE_CLOCK_TICK (tick) {
  return `[OP_TICK] Clock tick: ${JSON.stringify(tick, null, '  ')}`;
}

async function main (state = {}) {
  const clock = new Clock();
  const wallet = await OP_CREATE_WALLET(state.wallet);
  const patches = []; // TODO: get from state

  clock.on('tick', (tick) => {
    
  });

  return {
    clock: clock,
    patches: patches
  };
}

module.exports = main;