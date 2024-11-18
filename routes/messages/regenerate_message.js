'use strict';

module.exports = async function (req, res, next) {
  let subject = null;
  let {
    case_id,
    conversation_id,
    content,
    messageID,
    regenerate,
    file_fabric_id,
  } = req.body;

  if (!regenerate) console.warn('[SENSEMAKER:CORE]', '[WARNING]', 'PATCH /messages/:id called without `regenerate` flag.  This is a destructive operation.');

  const old_message = await this.db('messages').where({ id: req.params.id }).first();
  console.debug('old message:', old_message);

  if (!old_message) return res.status(404).json({ message: 'Message not found.' });
  // TODO: update message graph; consider requests, responses
  // flag message as regenerated
  // point to new answer
  // confirm acceptance of new answer

  try {
    const conversation = await this.db('conversations').where({ fabric_id: conversation_id }).first();
    if (!conversation) throw new Error(`No such Conversation: ${conversation_id}`);

    const newRequest = await this.db('requests').insert({
      message_id: messageID
    });

    // TODO: use correct method `handleTextRequest`
    this._handleRequest({
      // actor: activity.actor,
      conversation_id: conversation_id,
      subject: (subject) ? subject.title : null,
      input: content,
    }).then((output) => {
//           console.log('got request output:', output);
//           this.db('responses').insert({
//             content: output.object.content
//           });

//           this.db('messages').insert({
//             content: output.object.content,
//             conversation_id: conversation_id,
//             user_id: 1 // TODO: real user ID
//           }).then(async (response) => {
//             console.log('response created:', response);

//             if (isNew) {
//               const messages = await this._getConversationMessages(conversation_id);
//               const title = await this._summarizeMessagesToTitle(messages.map((x) => {
//                 return { role: (x.user_id == 1) ? 'assistant' : 'user', content: x.content }
//               }));

//               await this.db('conversations').update({ title }).where({ id: conversation_id });
//             }
//           });
    });

    if (!conversation.log) conversation.log = [];
    if (typeof conversation.log == 'string') {
      conversation.log = JSON.parse(conversation.log);
    }

    // Attach new message to the conversation
   // conversation.log.push(newMessage[0]);

    await this.db('conversations').update({
      log: JSON.stringify(conversation.log)
    }).where({
      fabric_id: conversation_id
    });

    return res.json({
      message: 'Message sent.',
      object: {
        id: messageID,
        conversation: conversation_id
      }
    });
  } catch (error) {
    console.error('ERROR:', error);
    this.emit('error', `Failed to create message: ${error}`);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
