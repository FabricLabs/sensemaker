'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = function (req, res, next) {
  const request = req.body;
  if (!request) return res.status(400).json({ error: 'Invalid request.' });
  if (!request.messages) return res.status(400).json({ error: 'Invalid messages.' });

  request.user_id = req.user.id;

  this.handleTextRequest(request).catch((error) => {
    console.error('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Error:', error);
  }).then((response) => {
    if (!response) response = { content: 'Something went wrong.  Try again later.' };
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
            content: response.content
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
