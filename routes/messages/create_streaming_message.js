'use strict';

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Message = require('@fabric/core/types/message');

// Functions
const toRelativeTime = require('../../functions/toRelativeTime');

module.exports = async function (req, res, next) {
  const now = new Date();

  // Handle JSON parsing errors - this should not happen if body-parser is working correctly
  if (!req.body || typeof req.body !== 'object') {
    console.error('[STREAMING_MESSAGE]', 'Invalid request body:', req.body);

    // Try to parse the raw body if available
    let rawBody = '';
    if (req.rawBody) {
      rawBody = req.rawBody.toString();
      console.debug('[STREAMING_MESSAGE]', 'Raw body:', rawBody);
    }

    return res.status(400).json({
      message: 'Invalid JSON in request body',
      error: 'The request body must be valid JSON',
      rawBody: rawBody
    });
  }

  let isNew = false;
  let localMessageID = null;
  let localConversationID = null;
  let localFileID = null;
  let fabricConversationID = null;
  let {
    conversation_id,
    content,
    context,
    file_id,
    agent
  } = req.body;

  // Validate and clean content
  if (content && typeof content === 'string') {
    // Remove any extra quotes that might have been added
    content = content.replace(/^"|"$/g, '');
  } else if (content !== undefined && content !== null) {
    // If content is not a string, try to convert it
    content = String(content);
  }

  if (!conversation_id) {
    isNew = true;
    const name = `Conversation started ${toRelativeTime(now.toISOString())}`;
    const conversationData = {
      creator_id: req.user.id,
      log: JSON.stringify([]),
      title: name
    };

    // Add context if provided
    if (context) {
      conversationData.context = JSON.stringify(context);
    }

    const created = await this.db('conversations').insert(conversationData);
    localConversationID = created[0];

    // TODO: ensure no LocalConversation is shared externally
    const actor = new Actor({ type: 'LocalConversation', name: `sensemaker/conversations/${localConversationID}`, created: now });
    fabricConversationID = actor.id;
    await this.db('conversations').update({ fabric_id: fabricConversationID }).where({ id: localConversationID });
  } else {
    fabricConversationID = conversation_id;
  }

  if (file_id) {
    const file = await this.db('files').where({ fabric_id: file_id }).first();
    if (!file) throw new Error(`No such File: ${file_id}`);
    localFileID = file.id;

    // File is already ingested during upload, so we just need to add context
    context = {
      ...context,
      file: {
        id: file_id,
        name: file.name,
        fabric_id: file.fabric_id,
        mime_type: file.type
      }
    };
  }

  try {
    // Validate required fields
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content: content must be a non-empty string');
    }

    const conversation = await this.db('conversations').where({ fabric_id: fabricConversationID }).first();
    if (!conversation) throw new Error(`No such Conversation: ${fabricConversationID}`);

    localConversationID = conversation.id;

    // User Message
    const newMessage = await this.db('messages').insert({
      attachments: (file_id) ? JSON.stringify([file_id]) : JSON.stringify([]),
      content: content,
      conversation_id: localConversationID,
      user_id: req.user.id
    });

    localMessageID = newMessage[0];

    // Prepare Response
    if (!conversation.log) conversation.log = [];
    if (typeof conversation.log == 'string') {
      conversation.log = JSON.parse(conversation.log);
    }

    // Attach new message to the conversation
    conversation.log.push(localMessageID);

    await this.db('conversations').update({
      log: JSON.stringify(conversation.log)
    }).where({
      id: localConversationID
    });

    const localMessage = new Actor({ type: 'LocalMessage', name: `sensemaker/messages/${localMessageID}`, created: now });
    await this.db('messages').update({ fabric_id: localMessage.id }).where({ id: localMessageID });

    // Create a placeholder assistant message for streaming
    const assistantMessage = await this.db('messages').insert({
      content: `${this.sensemaker.settings.name} is thinking...`,
      conversation_id: localConversationID,
      user_id: 1, // System user ID
      status: 'computing'
    });

    const assistantMessageID = assistantMessage[0];
    const assistantActor = new Actor({ type: 'LocalMessage', name: `sensemaker/messages/${assistantMessageID}`, created: now });
    await this.db('messages').update({ fabric_id: assistantActor.id }).where({ id: assistantMessageID });

    // Attach assistant message to conversation
    conversation.log.push(assistantMessageID);
    await this.db('conversations').update({
      log: JSON.stringify(conversation.log)
    }).where({
      id: localConversationID
    });

    // Emit JSON-PATCH for conversation update
    const conversationPatch = {
      op: isNew ? 'add' : 'replace',
      path: `/conversations/${fabricConversationID}`,
      value: {
        log: conversation.log,
        updated_at: now.toISOString()
      }
    };
    const conversationPatchMessage = Message.fromVector(['JSONPatch', JSON.stringify(conversationPatch)]);
    this.http.broadcast(conversationPatchMessage);

    // Emit JSON-PATCH for user message
    const userMessagePatch = {
      op: 'add',
      path: `/messages/${localMessage.id}`,
      value: {
        content: content,
        status: 'ready',
        role: 'user',
        author: req.user.username || 'You',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    };
    const userMessagePatchMessage = Message.fromVector(['JSONPatch', JSON.stringify(userMessagePatch)]);
    this.http.broadcast(userMessagePatchMessage);

    // Emit JSON-PATCH for initial placeholder message
    const placeholderPatch = {
      op: 'add',
      path: `/messages/${assistantActor.id}`,
      value: {
        content: `${this.sensemaker.settings.name} is thinking...`,
        status: 'computing',
        role: 'assistant',
        author: this.sensemaker.settings.name,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    };
    const placeholderPatchMessage = Message.fromVector(['JSONPatch', JSON.stringify(placeholderPatch)]);
    this.http.broadcast(placeholderPatchMessage);

    // Send immediate response with conversation and message IDs
    res.json({
      message: 'Streaming message initiated.',
      object: {
        id: localMessage.id,
        conversation: fabricConversationID,
        assistant_message_id: assistantActor.id
      }
    });

    // Start streaming response in background using the summarizer agent
    const messages = await this._getConversationMessages(fabricConversationID);
    const messageHistory = messages.map((x) => {
      return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
    });

    console.debug('[STREAMING_MESSAGE]', 'Starting streaming with:', {
      query: content,
      messageHistory: messageHistory.length,
      context: context,
      assistantActorId: assistantActor.id
    });

    // Prepare the request using handleTextRequest logic
    const request = {
      query: content,
      conversation_id: fabricConversationID,
      context: context,
      user_id: req.user.id,
      agent: agent,
      timeout: 30000 // 30 second timeout
    };

    // Use handleTextRequest to prepare the full request context
    try {
      const preparedRequest = await this.prepareTextRequest(request);
      console.debug('[STREAMING_MESSAGE]', 'Prepared request:', {
        query: preparedRequest.query,
        messagesCount: preparedRequest.messages.length,
        hasContext: !!preparedRequest.context,
        hasUser: !!preparedRequest.user
      });

      // Use the prepared request for streaming
      await this.streamTextResponse(preparedRequest, assistantActor.id, fabricConversationID, isNew, localConversationID);

    } catch (error) {
      console.error('[STREAMING_MESSAGE]', 'Error preparing request:', error);

      // Update message with error status
      await this.db('messages').update({
        content: 'Sorry, I encountered an error while processing your request.',
        status: 'error'
      }).where({ fabric_id: assistantActor.id });

      // Emit JSON-PATCH for error status
      const errorPatch = {
        op: 'replace',
        path: `/messages/${assistantActor.id}`,
        value: {
          content: 'Sorry, I encountered an error while processing your request.',
          status: 'error',
          updated_at: now.toISOString()
        }
      };
      const errorPatchMessage = Message.fromVector(['JSONPatch', JSON.stringify(errorPatch)]);
      this.http.broadcast(errorPatchMessage);
    }

  } catch (error) {
    console.error('ERROR:', error);
    this.emit('error', `Failed to create streaming message: ${error}`);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
