'use strict';

const Actor = require('@fabric/core/types/actor');
const Message = require('@fabric/core/types/message');

module.exports = async function (req, res, next) {
  console.debug('[SENSEMAKER]', '[HTTP]', 'Handling inbound message:', req.body);

  let isNew = false;
  let subject = null;
  let {
    conversation_id,
    content,
    context,
    file_fabric_id
  } = req.body;

  if (!conversation_id) {
    isNew = true;
    const now = new Date();
    const name = `Conversation Started ${now.toISOString()}`;
    /* const room = await this.matrix.client.createRoom({ name: name }); */
    const created = await this.db('conversations').insert({
      creator_id: req.user.id,
      log: JSON.stringify([]),
      title: name,
      file_fabric_id: file_fabric_id,
      // matrix_room_id: room.room_id
    });

    // TODO: document why array only for Postgres
    // all others return the numeric id (Postgres returns an array with a numeric element)
    conversation_id = created[0];

    // TODO: ensure no LocalConversation is shared externally
    const actor = new Actor({ type: 'LocalConversation', name: `sensemaker/conversations/${conversation_id}`, created: now });
    await this.db('conversations').update({ fabric_id: actor.id }).where({ id: conversation_id });
  }

  try {
    const conversation = await this.db('conversations').where({ id: conversation_id }).first();
    if (!conversation) throw new Error(`No such Conversation: ${conversation_id}`);

    // User Message
    const newMessage = await this.db('messages').insert({
      content: content,
      conversation_id: conversation_id,
      user_id: req.user.id
    });

    // Core Pipeline
    // this.createTimedRequest({
    this.handleTextRequest({
      conversation_id: conversation_id,
      context: {
        ...context,
        user_id: req.user.id,
        username: req.user.username
      },
      query: content
    }).catch((exception) => {
      console.error('[SENSEMAKER]', '[HTTP]', 'Error creating timed request:', exception);
    }).then(async (request) => {
      console.debug('[SENSEMAKER]', '[HTTP]', 'Created text request:', request);
      // TODO: emit message

      if (!request || !request.content) {
        console.debug('[SENSEMAKER]', '[HTTP]', 'No request content:', request);
        return;
      }

      const history = await this._getConversationMessages(conversation_id);
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
          if (title) await this.db('conversations').update({ title }).where({ id: conversation_id });

          const conversation = { id: conversation_id, messages: messages, title: title };
          const message = Message.fromVector(['Conversation', JSON.stringify(conversation)]);

          this.http.broadcast(message);
        });
      }

      this._summarizeMessages(messages).catch((error) => {
        console.error('[SENSEMAKER]', '[HTTP]', 'Error summarizing messages:', error);
      }).then(async (output) => {
        if (this.settings.debug) console.debug('[SENSEMAKER]', '[HTTP]', 'Summarized conversation:', output);
        let summary = output?.content || 'broken content summary';
        if (summary && summary.length > 512) summary = summary.split(/\s+/)[0].slice(0, 512).trim();
        if (summary) await this.db('conversations').update({ summary }).where({ id: conversation_id });

        const conversation = { id: conversation_id, messages: messages, summary: summary };
        const message = Message.fromVector(['Conversation', JSON.stringify(conversation)]);

        this.http.broadcast(message);
      });
    }).then(async () => {
      // Sanity Function
      console.debug('[SENSEMAKER]', '[HTTP]', 'Finished processing message');
      /* const basic = await this.handleTextRequest({
        // conversation_id: conversation_id,
        query: content
      });
      console.debug('[SENSEMAKER]', '[HTTP]', 'Got basic response:', basic); */
    });
    // End Core Pipeline

    // Prepare Response
    if (!conversation.log) conversation.log = [];
    if (typeof conversation.log == 'string') {
      conversation.log = JSON.parse(conversation.log);
    }

    // Attach new message to the conversation
    conversation.log.push(newMessage[0]);

    await this.db('conversations').update({
      log: JSON.stringify(conversation.log)
    }).where({
      id: conversation_id
    });

    return res.json({
      message: 'Message sent.',
      object: {
        id: newMessage[0],
        conversation: conversation_id,
        // cards: request.cards
      }
    });
  } catch (error) {
    console.error('ERROR:', error);
    this.emit('error', `Failed to create message: ${error}`);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
