'use strict';

const { CORE_MODEL } = require('../../constants');
const {
  ollamaCreatedAt,
  lastUserQueryFromMessages,
  runOllamaChatStream
} = require('./ollamaCommon');

module.exports = async function (req, res) {
  const body = req.body || {};
  if (!body.messages || !Array.isArray(body.messages) || !body.messages.length) {
    return res.status(400).json({ error: 'messages (non-empty array) is required' });
  }

  const model = body.model || this.settings.ollama?.model || CORE_MODEL;
  const messages = body.messages.map((m) => ({
    role: m.role === 'agent' ? 'assistant' : m.role,
    content: m.content
  }));
  const query = lastUserQueryFromMessages(messages);
  if (!query) {
    return res.status(400).json({ error: 'No user message with content found' });
  }

  const temperature = body.options?.temperature ?? body.temperature;
  const maxTokens = body.options?.num_predict ?? body.num_predict ?? body.max_tokens;

  if (body.stream === true) {
    return runOllamaChatStream(this, res, {
      model,
      messages,
      query,
      temperature,
      maxTokens
    });
  }

  try {
    const out = await this.pool.query({
      model,
      query,
      messages,
      stream: false,
      temperature,
      max_tokens: maxTokens
    });
    const text = (out && (out.content || out.response)) || '';
    return res.json({
      model,
      created_at: ollamaCreatedAt(),
      message: { role: 'assistant', content: text },
      done: true
    });
  } catch (err) {
    console.error('[OLLAMA:MIRROR]', '/api/chat', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
