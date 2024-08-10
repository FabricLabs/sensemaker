'use strict';

// Dependencies
const fs = require('fs');
const path = require('path');

// Baseline Prompt
const prompt = path.join(__dirname, '../prompts/sensemaker.txt');
const baseline = fs.readFileSync(prompt, 'utf8');

// Constants
const {
  OPENAI_API_KEY
} = require('../constants');

// Hosts
// TODO: network DNS configuration
const ALPHA = '10.8.0.50';
const HIVEMIND = 'balrog'; // must be in /etc/hosts or otherise provided by local DNS
const SOCRATES = 'socrates'; // must be in /etc/hosts or otherise provided by local DNS
const YMIR = '10.8.0.3';
const ODIN = '10.8.0.4';
const THOR = '10.8.0.5';
const TANGO = '10.8.0.30';
const FOXTROT = '10.8.0.31';
const MANGO = '10.8.0.32';
const BALROG = '10.8.0.33';
const CLARITY = '10.8.0.34';
const DURINSBANE = '10.8.0.35';
const GOTHMOG = '10.8.0.60';

module.exports = {
  local: {
    name: 'LOCAL',
    prompt: baseline.toString('utf8'),
    model: 'llama3',
    host: '127.0.0.1',
    port: 11434,
    secure: false,
    temperature: 0
  },
  /* alpha: {
    name: 'ALPHA',
    prompt: baseline.toString('utf8'),
    model: 'llama3',
    host: ALPHA,
    port: 11434,
    secure: false,
    temperature: 0
  }, */
  /* balrog: {
    name: 'BALROG',
    prompt: baseline.toString('utf8'),
    model: 'llama3:70b',
    host: BALROG,
    port: 11434,
    secure: false,
    fabric: false,
    temperature: 0
  },
  durinsbane: {
    name: 'DURINSBANE',
    prompt: baseline.toString('utf8'),
    model: 'llama3:70b',
    host: DURINSBANE,
    port: 11434,
    secure: false,
    fabric: false,
    temperature: 0
  }, */
  /* 'llama3-70b-fp16': {
    name: 'GOTHMOG',
    prompt: baseline.toString('utf8'),
    model: 'llama3:70b-instruct-fp16',
    host: GOTHMOG,
    port: 11434,
    secure: false,
    fabric: false,
    temperature: 0
  }, */
  /* gemma: {
    name: 'GEMMA',
    prompt: baseline.toString('utf8'),
    model: 'gemma2',
    host: GOTHMOG,
    port: 11434,
    secure: false,
    fabric: false,
    temperature: 0
  }, */
  /* socrates: {
    name: 'SOCRATES',
    prompt: baseline.toString('utf8'),
    model: 'gemma',
    host: SOCRATES,
    port: 11434,
    secure: false
  }, */
  /* TODO: enable hivemind */
  /* hivemind: {
    name: 'HIVEMIND',
    prompt: baseline.toString('utf8'),
    model: 'llama3:70b',
    host: BALROG,
    port: 3045,
    secure: false,
    temperature: 0
  }, */
  /* mango: {
    name: 'MANGO',
    prompt: baseline.toString('utf8'),
    model: 'wizardlm2:7b-fp16',
    host: MANGO,
    port: 11434,
    secure: false,
    temperature: 0
  }, */
  /* clarity: {
    name: 'CLARITY',
    prompt: baseline.toString('utf8'),
    model: 'wizardlm2:7b-fp16',
    host: CLARITY,
    port: 11434,
    secure: false,
    temperature: 0
  }, */
  /*
  beta: {
    prompt: novoPrompt.toString('utf8'),
    model: 'llama2',
    host: 'ollama.jeeves.dev',
    port: 11434,
    secure: false
  },
  gamma: {
    prompt: novoPrompt.toString('utf8'),
    model: 'gemma',
    host: 'ollama.trynovo.com',
    port: 443,
    secure: true
  },
  ymir: {
    prompt: novoPrompt.toString('utf8'),
    model: 'mixtral',
    host: YMIR,
    port: 11434,
    secure: false
  },
  odin: {
    prompt: novoPrompt.toString('utf8'),
    model: 'gemma',
    host: ODIN,
    port: 11434,
    secure: false
  },
  thor: {
    prompt: novoPrompt.toString('utf8'),
    model: 'yarn-llama2:7b-128k',
    host: THOR,
    port: 11434,
    secure: false
  },
  llama: {
    prompt: novoPrompt.toString('utf8'),
    model: 'llama2',
    host: YMIR,
    port: 11434,
    secure: false
  }, */
  // Untested Agents
  /* cinco: {
    prompt: novoPrompt.toString('utf8'),
    model: 'llama2',
    host: 'cinco',
    port: 11434,
    secure: false
  },
  chuck: {
    prompt: novoPrompt.toString('utf8'),
    model: 'llama2',
    host: '192.168.127.100',
    port: 11434,
    secure: false
  }, */
  // Network Agents
  // Untested so far
  /*
  chatgpt: {
    prompt: novoPrompt.toString('utf8'),
    host: null
  },
  delta: {
    prompt: novoPrompt.toString('utf8'),
    model: 'llama2',
    host: 'delta.trynovo.com',
    port: 443,
    secure: true
  },
  mistral: {
    prompt: betaPrompt.toString('utf8'),
    model: 'mistral',
    host: '192.168.127.175',
    port: 11434,
    secure: false
  },
  gemma: {
    prompt: novoPrompt.toString('utf8'),
    model: 'gemma',
    host: 'localhost',
    port: 11434,
    secure: false
  }, */
  // OpenAI Services
  /* 'GPT-4': {
    prompt: baseline.toString('utf8'),
    model: 'gpt-4-0613',
    host: 'api.openai.com',
    port: 443,
    secure: true,
    fabric: false,
    temperature: 0,
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY || OPENAI_API_KEY}`,
      // 'OpenAI-Organization': '',
      // 'OpenAI-Project': ''
    }
  },
  'GPT-4-turbo': {
    prompt: baseline.toString('utf8'),
    model: 'gpt-4-turbo-2024-04-09',
    host: 'api.openai.com',
    port: 443,
    secure: true,
    fabric: false,
    temperature: 0,
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY || OPENAI_API_KEY}`,
      // 'OpenAI-Organization': '',
      // 'OpenAI-Project': ''
    }
  }, */
  /* 'GPT-4o': {
    prompt: baseline.toString('utf8'),
    model: 'gpt-4o-2024-05-13',
    host: 'api.openai.com',
    port: 443,
    secure: true,
    fabric: false,
    temperature: 0,
    openai: { enable: true },
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY || OPENAI_API_KEY}`,
      // 'OpenAI-Organization': '',
      // 'OpenAI-Project': ''
    }
  } */
};
