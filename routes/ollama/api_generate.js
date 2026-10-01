'use strict';

const { CORE_MODEL } = require('../../constants');
const { ollamaCreatedAt, runOllamaGenerateStream } = require('./ollamaCommon');

module.exports = async function (req, res) {
  const body = req.body || {};
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const model = body.model || this.settings.ollama?.model || CORE_MODEL;
  const temperature = body.options?.temperature ?? body.temperature;
  const maxTokens = body.options?.num_predict ?? body.num_predict ?? body.num_ctx;

  if (body.stream === true) {
    return runOllamaGenerateStream(this, res, {
      model,
      prompt,
      temperature,
      maxTokens
    });
  }

  try {
    const messages = [{ role: 'user', content: prompt }];
    const out = await this.pool.query({
      model,
      query: prompt,
      messages,
      stream: false,
      temperature,
      max_tokens: maxTokens
    });
    const text = (out && (out.content || out.response)) || '';
    return res.json({
      model,
      created_at: ollamaCreatedAt(),
      response: text,
      done: true
    });
  } catch (err) {
    console.error('[OLLAMA:MIRROR]', '/api/generate', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
