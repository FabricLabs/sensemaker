'use strict';

const Sensemaker = require('../types/sensemaker');

async function Agent (input = '') {
  const sensemaker = new Sensemaker(input);
  await sensemaker.start();
}

module.exports = Agent;
