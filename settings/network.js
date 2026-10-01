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
    // Do not set host/port here: settings/local.js merges this file *after* the base
    // `agents.local` block, and lodash.merge would overwrite Ollama host (e.g.
    // 192.168.50.5 or OLLAMA_HOST) with a fixed localhost — see worker Agent "LOCAL".
    secure: false,
    temperature: 0
  }
};
