'use strict';

// Dependencies
const fs = require('fs');
const path = require('path');

// Baseline Prompt
const prompt = path.join(__dirname, '../prompts/sensemaker.txt');
const baseline = fs.readFileSync(prompt, 'utf8');

module.exports = {
  local: {
    name: 'LOCAL',
    prompt: baseline.toString('utf8'),
    model: 'llama3.2',
    host: '127.0.0.1',
    port: 11434,
    secure: false,
    temperature: 0
  }
};
