'use strict';

const Actor = require('@fabric/core/types/actor');
const Message = require('@fabric/core/types/message');

module.exports = async function (req, res, next) {
  console.debug('[NOVO]', '[HTTP]', 'Handling inbound message:', req.body);

  let isNew = false;
  let subject = null;
  let {
    case_id,
    conversation_id,
    content,
    matter_id,
    file_fabric_id
  } = req.body;
  console.log('fabric id', file_fabric_id);
  if (!conversation_id) {
    isNew = true;

    const now = new Date();
    const name = `Conversation Started ${now.toISOString()}`;
    /* const room = await this.matrix.client.createRoom({ name: name }); */
    const created = await this.db('conversations').insert({
      creator_id: req.user.id,
      log: JSON.stringify([]),
      title: name,
      matter_id: matter_id,
      file_fabric_id: file_fabric_id,
      // matrix_room_id: room.room_id
    });

    // TODO: document why array only for Postgres
    // all others return the numeric id (Postgres returns an array with a numeric element)
    conversation_id = created[0];
  }

  if (case_id) {
    try {
      subject = await this.db('cases').select('id', 'title', 'harvard_case_law_court_name as court_name', 'decision_date').where('id', case_id).first();
    } catch (exception) {
      this.emit('warning', `Could not find case ID: ${case_id}`);
    }
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
    this.createTimedRequest({
      conversation_id: conversation_id,
      matter_id: matter_id,
      query: content
    }).catch((exception) => {
      console.error('[JEEVES]', '[HTTP]', 'Error creating timed request:', exception);
    }).then(async (request) => {
      console.debug('[JEEVES]', '[HTTP]', 'Created timed request:', request);
      // TODO: emit message

      if (!request || !request.content) {
        console.debug('[JEEVES]', '[HTTP]', 'No request content:', request);
        return;
      }

      // Card Extraction
      /* this.extractor.query({
        query: `$CONTENT\n\`\`\`\n${request.content}\n\`\`\``
      }).then(async (extracted) => {
        console.debug('[NOVO]', '[HTTP]', 'Got extractor output:', extracted.content);
        if (extracted && extracted.content) {
          try {
            const caseCards = JSON.parse(extracted.content).map((x) => {
              const actor = new Actor({ name: x });
              return {
                type: 'CaseCard',
                content: { id: actor.id }
              };
            });

            const updated = await this.db('messages').where({ id: newMessage[0] }).update({
              cards: JSON.stringify(caseCards.map((x) => x.content.id))
            });
          } catch (exception) {
            console.error('[JEEVES]', '[HTTP]', '[MESSAGE]', 'Error updating cards:', exception);
          }
        }
      }); */

      const history = await this._getConversationMessages(conversation_id);
      const messages = history.map((x) => {
        return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
      });

      if (isNew) {
        this._summarizeMessagesToTitle(messages).catch((error) => {
          console.error('[NOVO]', '[HTTP]', 'Error summarizing messages:', error);
        }).then(async (output) => {
          if (this.settings.debug) console.debug('[JEEVES]', '[HTTP]', 'Got title output:', output);
          let title = output?.content || 'broken content title';
          if (title && title.length > 100) title = title.split(/\s+/)[0].slice(0, 100).trim();
          if (title) await this.db('conversations').update({ title }).where({ id: conversation_id });

          const conversation = { id: conversation_id, messages: messages, title: title };
          const message = Message.fromVector(['Conversation', JSON.stringify(conversation)]);

          this.http.broadcast(message);
        });
      }

      this._summarizeMessages(messages).catch((error) => {
        console.error('[NOVO]', '[HTTP]', 'Error summarizing messages:', error);
      }).then(async (output) => {
        if (this.settings.debug) console.debug('[JEEVES]', '[HTTP]', 'Summarized conversation:', output);
        let summary = output?.content || 'broken content summary';
        if (summary && summary.length > 512) summary = summary.split(/\s+/)[0].slice(0, 512).trim();
        if (summary) await this.db('conversations').update({ summary }).where({ id: conversation_id });

        const conversation = { id: conversation_id, messages: messages, summary: summary };
        const message = Message.fromVector(['Conversation', JSON.stringify(conversation)]);

        this.http.broadcast(message);
      });
    }).then(async () => {
      // Sanity Function
      console.debug('[JEEVES]', '[HTTP]', 'Finished processing message');
      const basic = await this.handleTextRequest({
        // conversation_id: conversation_id,
        matter_id: matter_id,
        query: content
      });

      console.debug('[JEEVES]', '[HTTP]', 'Got basic response:', basic);
    });
    // End Core Pipeline

    // pre-release pipeline
    /* const inserted = await this.db('requests').insert({
      message_id: newMessage[0],
      content: 'Jeeves is thinking...'
    });

    this._handleRequest({
      // actor: activity.actor,
      conversation_id: conversation_id,
      subject: (subject) ? `${subject.title}, ${subject.court_name}, ${subject.decision_date}` : null,
      input: content,
      // room: roomID // TODO: replace with a generic property (not specific to Matrix)
      // target: activity.target // candidate 1
    }).then(async (output) => {
      console.debug('[JEEVES]', '[HTTP]', 'Got request output:', output);
    */

      // TODO: restore response tracking
      /* this.db('responses').insert({
        // TODO: store request ID
        content: output.object.content
      }); */

      // TODO: restore titling
    /*
    }); */

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
