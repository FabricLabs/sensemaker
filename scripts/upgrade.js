'use strict';

const OP_BOOT = require('../migrations/boot');
const settings = require('../settings/default');

const Actor = require('@fabric/core/types/actor');

async function main (input = {}) {
  const state = Object.assign({}, input);
  const actor = new Actor(state);
  const agents = [];
  const scripts = [
    OP_BOOT  
  ];

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const result = await script.apply({}, [ state ]);
    agents.push(result);
  }

  const ticks = agents[0].ticks;
  const changes = actor._applyChanges([
    { op: 'add', path: '/ticks', value: agents[0].ticks }
  ]);

  return {
    id: '',
    state: state,
    changes: changes
  };
}

main(settings).catch((exception) => {
  console.error('[SCRIPTS:UPGRADE] Main Process Exception:', exception);
}).then((output) => {
  console.log('[SCRIPTS:UPGRADE] Main Process Output:', output);
});