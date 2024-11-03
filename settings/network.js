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
