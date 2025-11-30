'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const request = req.body;
  if (!request) return res.status(400).json({ error: 'Invalid request.' });
  if (!request.messages) return res.status(400).json({ error: 'Invalid messages.' });

  request.user_id = req.user.id;

  // Store message objects and content as blobs
  const messageBlobIds = [];
  const contentBlobIds = [];

  try {
    // Store each message object as a blob
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

      // Store message content as separate blob if it exists
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
    // Continue even if blob storage fails
  }

  // For benchmarking, we want to directly use the Pool with the specified model
  // instead of going through the full pipeline
  if (request.model) {
    console.debug('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Direct pool request with model:', request.model);

    // Convert messages to query format for Pool
    const lastMessage = request.messages[request.messages.length - 1];
    const query = lastMessage.content;

    // Create pool request
    const poolRequest = {
      model: request.model,
      query: query,
      temperature: request.temperature || 0.1,
      max_tokens: request.max_tokens || 500,
      messages: request.messages // Keep original messages for context
    };

    this.pool.query(poolRequest).then(async (response) => {
      console.debug('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Pool response:', response);

      const assistantMessage = {
        role: 'assistant',
        content: response.content || response.response || 'No response content'
      };

      // Store assistant message and content as blobs
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

      const object = {
        object: 'chat.completion',
        created: Date.now() / 1000,
        model: request.model,
        system_fingerprint: 'net_sensemaker',
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
        // Add blob references for browsing
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
  } else {
    // Fallback to original pipeline for requests without specific model
    this.handleTextRequest(request).catch((error) => {
      console.error('[SENSEMAKER:CORE]', '[API]', '[CHAT]', 'Error:', error);
    }).then(async (response) => {
      if (!response) response = { content: 'Something went wrong.  Try again later.' };

      const assistantMessage = {
        role: 'assistant',
        content: response.content
      };

      // Store assistant message and content as blobs
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

      const object = {
        object: 'chat.completion',
        created: Date.now() / 1000,
        model: request.model || 'sensemaker',
        system_fingerprint: 'net_sensemaker',
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
        // Add blob references for browsing
        message_blob_ids: messageBlobIds,
        content_blob_ids: contentBlobIds
      };

      const actor = new Actor(object);
      const output = merge({}, object, { id: actor.id });

      res.json(output);
    });
  }
};
