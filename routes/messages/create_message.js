'use strict';

const Actor = require('@fabric/core/types/actor');
const Message = require('@fabric/core/types/message');

module.exports = async function (req, res, next) {
  const now = new Date();

  let isNew = false;
  let localMessageID = null;
  let localConversationID = null;
  let fabricConversationID = null;
  let {
    conversation_id,
    content,
    context
  } = req.body;

  if (!conversation_id) {
    isNew = true;
    const name = `Conversation Started ${now.toISOString()}`;
    /* const room = await this.matrix.client.createRoom({ name: name }); */
    const created = await this.db('conversations').insert({
      creator_id: req.user.id,
      log: JSON.stringify([]),
      title: name,
      // matrix_room_id: room.room_id
    });

    localConversationID = created[0];

    // TODO: ensure no LocalConversation is shared externally
    const actor = new Actor({ type: 'LocalConversation', name: `sensemaker/conversations/${localConversationID}`, created: now });
    fabricConversationID = actor.id;
    await this.db('conversations').update({ fabric_id: fabricConversationID }).where({ id: localConversationID });
  } else {
    fabricConversationID = conversation_id;
  }

  try {
    const conversation = await this.db('conversations').where({ fabric_id: fabricConversationID }).first();
    if (!conversation) throw new Error(`No such Conversation: ${fabricConversationID}`);

    localConversationID = conversation.id;

    // User Message
    const newMessage = await this.db('messages').insert({
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

    // Core Pipeline
    // this.createTimedRequest({
    this.handleTextRequest({
      conversation_id: fabricConversationID,
      context: {
        ...context,
        user_id: req.user.id,
        username: req.user.username
      },
      query: content,
      user_id: req.user.id
    }).catch((exception) => {
      console.error('[SENSEMAKER]', '[HTTP]', 'Error creating timed request:', exception);
    }).then(async (request) => {
      console.debug('[SENSEMAKER]', '[HTTP]', 'Created text request:', request);
      // TODO: emit message

      if (!request || !request.content) {
        console.debug('[SENSEMAKER]', '[HTTP]', 'No request content:', request);
        return;
      }

      const history = await this._getConversationMessages(conversation.id);
      const messages = history.map((x) => {
        return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
      });

      if (isNew) {
        this._summarizeMessagesToTitle(messages).catch((error) => {
          console.error('[SENSEMAKER]', '[HTTP]', 'Error summarizing messages:', error);
        }).then(async (output) => {
          if (this.settings.debug) console.debug('[SENSEMAKER]', '[HTTP]', 'Got title output:', output);
          let title = output?.content || 'broken content title';
          if (title && title.length > 100) title = title.split(/\s+/)[0].slice(0, 100).trim();
          if (title) await this.db('conversations').update({ title }).where({ id: localConversationID });
          const msg = { id: fabricConversationID, messages: messages, title: title };
          const message = Message.fromVector(['Conversation', JSON.stringify(msg)]);
          this.http.broadcast(message);
        });
      }

      this._summarizeMessages(messages).catch((error) => {
        console.error('[SENSEMAKER]', '[HTTP]', 'Error summarizing messages:', error);
      }).then(async (output) => {
        if (this.settings.debug) console.debug('[SENSEMAKER]', '[HTTP]', 'Summarized conversation:', output);
        let summary = output?.content || 'broken content summary';
        if (summary && summary.length > 512) summary = summary.split(/\s+/)[0].slice(0, 512).trim();
        if (summary) await this.db('conversations').update({ summary }).where({ id: localConversationID });
        const msg = { id: fabricConversationID, messages: messages, summary: summary };
        const message = Message.fromVector(['Conversation', JSON.stringify(msg)]);
        this.http.broadcast(message);
      });
    }).then(async () => {
      console.debug('[SENSEMAKER]', '[HTTP]', 'Finished processing message');
    });
    // End Core Pipeline

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
