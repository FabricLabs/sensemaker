'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');
const chatStreamBridge = require('../../services/chatStreamBridge');

function beginOpenAiSse (res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
}

function sseErrorAndClose (res, err) {
  if (!res || res.writableEnded) return;
  try {
    chatStreamBridge.writeSseEvent(res, { error: { message: err.message || String(err), type: 'api_error' } });
  } catch (e) { /* ignore */ }
  chatStreamBridge.writeSseDone(res);
  res.end();
}

module.exports = async function (req, res, next) {
  const request = req.body;
  if (!request) return res.status(400).json({ error: 'Invalid request.' });
  if (!request.messages) return res.status(400).json({ error: 'Invalid messages.' });

  request.user_id = req.user.id;
  const wantStream = request.stream === true;

  if (!request.query && request.messages && request.messages.length) {
    const last = request.messages[request.messages.length - 1];
    request.query = typeof last.content === 'string' ? last.content : JSON.stringify(last.content || '');
  }

  const messageBlobIds = [];
  const contentBlobIds = [];

  try {
    for (const message of request.messages) {
      const messageActor = new Actor(message);
      const messageBlob = await this.db('blobs').where({ fabric_id: messageActor.id }).first();

      if (!messageBlob) {
        await this.db('blobs').insert({
          fabric_id: messageActor.id,
          content: JSON.stringify(message),
          mime_type: 'application/json'
        });
      }
      messageBlobIds.push(messageActor.id);

      if (message.content) {
        const contentActor = new Actor({ content: message.content });
        const contentBlob = await this.db('blobs').where({ fabric_id: contentActor.id }).first();

        if (!contentBlob) {
          await this.db('blobs').insert({
            fabric_id: contentActor.id,
            content: message.content,
            mime_type: 'text/plain'
          });
        }
        contentBlobIds.push(contentActor.id);
      }
    }
  } catch (error) {
    console.error('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Error storing message blobs:', error);
  }

  const storeAssistantBlobs = async (assistantMessage) => {
    try {
      const assistantMessageActor = new Actor(assistantMessage);
      const assistantMessageBlob = await this.db('blobs').where({ fabric_id: assistantMessageActor.id }).first();

      if (!assistantMessageBlob) {
        await this.db('blobs').insert({
          fabric_id: assistantMessageActor.id,
          content: JSON.stringify(assistantMessage),
          mime_type: 'application/json'
        });
      }
      messageBlobIds.push(assistantMessageActor.id);

      if (assistantMessage.content) {
        const assistantContentActor = new Actor({ content: assistantMessage.content });
        const assistantContentBlob = await this.db('blobs').where({ fabric_id: assistantContentActor.id }).first();

        if (!assistantContentBlob) {
          await this.db('blobs').insert({
            fabric_id: assistantContentActor.id,
            content: assistantMessage.content,
            mime_type: 'text/plain'
          });
        }
        contentBlobIds.push(assistantContentActor.id);
      }
    } catch (error) {
      console.error('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Error storing assistant message blobs:', error);
    }
  };

  if (request.model) {
    const lastMessage = request.messages[request.messages.length - 1];
    const query = lastMessage.content;

    const poolRequest = {
      model: request.model,
      query: query,
      temperature: request.temperature || 0.1,
      max_tokens: request.max_tokens || 500,
      messages: request.messages
    };

    if (wantStream) {
      beginOpenAiSse(res);
      const completionId = chatStreamBridge.newCompletionId();
      const created = Math.floor(Date.now() / 1000);
      const streamActor = new Actor({ type: 'PoolChatCompletion', model: request.model });
      const conversationId = request.conversation_id || null;

      chatStreamBridge.fabricStreamStart(this, {
        id: streamActor.id,
        conversation_id: conversationId,
        model: request.model
      });
      chatStreamBridge.writeSseEvent(res, chatStreamBridge.openAiChatCompletionChunk({
        id: completionId,
        model: request.model,
        created,
        delta: { role: 'assistant' }
      }));

      try {
        const response = await this.pool.query({
          ...poolRequest,
          stream: true,
          onStreamChunk: (delta) => {
            chatStreamBridge.fabricStreamChunk(this, {
              id: streamActor.id,
              conversation_id: conversationId,
              content: delta,
              model: request.model
            });
            chatStreamBridge.writeSseEvent(res, chatStreamBridge.openAiChatCompletionChunk({
              id: completionId,
              model: request.model,
              created,
              delta: { content: delta }
            }));
          }
        });

        const assistantMessage = {
          role: 'assistant',
          content: response.content || response.response || ''
        };
        await storeAssistantBlobs(assistantMessage);

        chatStreamBridge.writeSseEvent(res, chatStreamBridge.openAiChatCompletionChunk({
          id: completionId,
          model: request.model,
          created,
          delta: {},
          finishReason: 'stop'
        }));
        chatStreamBridge.writeSseDone(res);
        res.end();
      } catch (error) {
        console.error('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Pool stream error:', error);
        sseErrorAndClose(res, error);
      }
      return;
    }

    this.pool.query(poolRequest).then(async (response) => {
      const assistantMessage = {
        role: 'assistant',
        content: response.content || response.response || 'No response content'
      };
      await storeAssistantBlobs(assistantMessage);

      const object = {
        object: 'chat.completion',
        created: Date.now() / 1000,
        model: request.model,
        system_fingerprint: 'fp_sensemaker',
        choices: [
          {
            index: 0,
            message: assistantMessage,
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        message_blob_ids: messageBlobIds,
        content_blob_ids: contentBlobIds
      };

      const actor = new Actor(object);
      const output = merge({}, object, { id: actor.id });
      res.json(output);
    }).catch((error) => {
      console.error('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Pool query error:', error);
      res.status(500).json({
        error: 'Failed to process request',
        message: error.message
      });
    });
    return;
  }

  if (wantStream) {
    beginOpenAiSse(res);
    request._openAiStream = {
      res,
      completionId: chatStreamBridge.newCompletionId(),
      model: request.model || this.settings.ollama?.model || 'sensemaker',
      created: Math.floor(Date.now() / 1000)
    };
  }

  this.handleTextRequest(request).then(async (response) => {
    if (wantStream) {
      return;
    }
    if (!response) response = { content: 'Something went wrong.  Try again later.' };

    const assistantMessage = {
      role: 'assistant',
      content: response.content
    };
    await storeAssistantBlobs(assistantMessage);

    const object = {
      object: 'chat.completion',
      created: Date.now() / 1000,
      model: request.model || 'sensemaker',
      system_fingerprint: 'fp_sensemaker',
      choices: [
        {
          index: 0,
          message: assistantMessage,
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      message_blob_ids: messageBlobIds,
      content_blob_ids: contentBlobIds
    };

    const actor = new Actor(object);
    const output = merge({}, object, { id: actor.id });
    res.json(output);
  }).catch((error) => {
    console.error('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Error:', error);
    if (wantStream) {
      sseErrorAndClose(res, error);
      return;
    }
    res.status(500).json({
      error: 'Failed to process request',
      message: error.message
    });
  });
};
