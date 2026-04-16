'use strict';

const Actor = require('@fabric/core/types/actor');

const toRelativeTime = require('../../functions/toRelativeTime');

module.exports = async function (req, res, next) {
  if (!req.user || req.user.id == null) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const now = new Date();

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
    // Remove duplicate ingestion and just add file context
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
    const conversation = await this.db('conversations').where({ fabric_id: fabricConversationID }).first();
    if (!conversation) throw new Error(`No such Conversation: ${fabricConversationID}`);

    if (!isNew && !(await this._userCanAccessConversation(req, conversation))) {
      return res.status(403).json({ message: 'Not allowed to post to this conversation.' });
    }

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

    const placeholderContent = `Waiting in queue… (${this.settings.name} will reply shortly.)`;
    const assistantRow = await this.db('messages').insert({
      conversation_id: localConversationID,
      user_id: 1,
      status: 'queued',
      content: placeholderContent
    });
    const responseMessageId = assistantRow[0];
    const assistantActor = new Actor({ type: 'LocalMessage', name: `sensemaker/messages/${responseMessageId}`, created: now });
    await this.db('messages').update({ fabric_id: assistantActor.id }).where({ id: responseMessageId });

    conversation.log.push(responseMessageId);
    await this.db('conversations').update({
      log: JSON.stringify(conversation.log)
    }).where({ id: localConversationID });

    if (this.activeWorkerQueue) {
      await this.activeWorkerQueue.enqueue({
        type: 'conversation_turn',
        conversation_fabric_id: fabricConversationID,
        local_conversation_id: localConversationID,
        user_id: req.user.id,
        query: content,
        context: context,
        agent: agent,
        response_message_id: responseMessageId,
        is_new: isNew
      });
    } else {
      console.error('[SENSEMAKER]', '[HTTP]', 'activeWorkerQueue missing; falling back to inline handleTextRequest');
      this.handleTextRequest({
        conversation_id: fabricConversationID,
        context: context,
        agent: agent,
        query: content,
        user_id: req.user.id,
        existing_response_message_id: responseMessageId
      }).then(async () => {
        await this._finalizeConversationAfterReply({
          localConversationID: localConversationID,
          fabricConversationID: fabricConversationID,
          isNew: isNew
        });
      }).catch((exception) => {
        console.error('[SENSEMAKER]', '[HTTP]', 'Inline text request failed:', exception);
      });
    }

    const localMessage = new Actor({ type: 'LocalMessage', name: `sensemaker/messages/${localMessageID}`, created: now });
    await this.db('messages').update({ fabric_id: localMessage.id }).where({ id: localMessageID });

    return res.json({
      message: 'Message sent.',
      object: {
        id: localMessage.id,
        conversation: fabricConversationID,
        // cards: request.cards
      }
    });
  } catch (error) {
    console.error('ERROR:', error);
    this.emit('error', `Failed to create message: ${error}`);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
