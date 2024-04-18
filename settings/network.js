'use strict';

// Dependencies
const fs = require('fs');
const path = require('path');
const prompt = path.join(__dirname, '../prompts/novo.txt');
const baseline = fs.readFileSync(prompt, 'utf8');

// Hosts
// TODO: network DNS configuration
const HIVEMIND = 'balrog'; // must be in /etc/hosts or otherise provided by local DNS
const YMIR = '10.8.0.3';
const ODIN = '10.8.0.4';
const THOR = '10.8.0.5';
const TANGO = '10.8.0.30';
const MANGO = '10.8.0.32';
const FOXTROT = '10.8.0.31';
const CLARITY = '10.8.0.34';
const BALROG = '10.8.0.33';

module.exports = {
  local: {
    prompt: baseline.toString('utf8'),
    model: 'mistral',
    host: '127.0.0.1',
    port: 11434,
    secure: false,
    temperature: 0
  },
  hivemind: {
    prompt: baseline.toString('utf8'),
    model: 'gemma',
    host: HIVEMIND,
    port: 3045,
    secure: false,
    temperature: 0
  }
};
