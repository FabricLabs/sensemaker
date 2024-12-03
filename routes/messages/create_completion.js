'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = function (req, res, next) {
  const request = req.body;
  console.debug('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Chat completion request:', request.body);
  const network = Object.keys(this.agents).map((agent) => {
    console.debug('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Sending request to agent:', agent, request.body);
    return this.agents[agent].query(request);
  });

  Promise.race(network).catch((error) => {
    console.error('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Error:', error);
    // res.status(500).json({ status: 'error', message: 'Internal server error.', error: error });
  }).then((results) => {
    console.debug('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Chat completion results:', results);
    if (!results) results = { content: 'Something went wrong.  Try again later.' };
    const object = {
      object: 'chat.completion',
      created: Date.now() / 1000,
      model: request.model || 'sensemaker',
      system_fingerprint: 'net_sensemaker',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: results.content
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    }

    const actor = new Actor(object);
    const output = merge({}, object, { id: actor.id });

    res.json(output);
  });
};
