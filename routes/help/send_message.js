'use strict';

const Message = require('@fabric/core/types/message');
const Token = require('@fabric/core/types/token'); // fabric tokens


module.exports = async function (req, res) {

  try {
    const { content, help_role } = req.body;
    let conversation_id = req.params.conversation_id;
    if (conversation_id == 0) {
      const created = await this.db('conversations').insert({
        creator_id: req.user.id,
        title: 'help conversation',
        help_chat: 1,
      });
      conversation_id = created[0];
    }

    console.log(req.user.id, content, req.params.conversation_id, help_role);

    const insert = await this.db('messages').insert({
      user_id: req.user.id,
      content: content,
      conversation_id: conversation_id,
      help_role: help_role,
    });

    const update = await this.db('conversations')
      .where({ id: conversation_id })
      .update({
        updated_at: new Date(),
      });

    const conversation = await this.db('conversations')
      .where({ id: conversation_id })
      .select('creator_id')
      .first();

    const conversationMessage = {
      sender: req.user.id,
      creator: conversation.creator_id,
      content: content,
      conversation_id: conversation_id,
      help_role: help_role,
    }

    if (help_role === 'admin') {
      conversationMessage.type = 'HelpMsgAdmin';
    } else {
      conversationMessage.type = 'HelpMsgUser';
    }
    //here we broadcast the message, telling 'Bridge.js' which role sent a message
    const message = Message.fromVector([conversationMessage.type, JSON.stringify(conversationMessage)]);
    this.http.broadcast(message);

    return res.send({
      message: 'Help Message successfully sent',
      conversation_id: conversation_id,
    });
  } catch (exception) {
    console.debug('[NOVO]', 'Error sending Help message:', exception);
    res.status(503);
    return res.send({
      type: 'SendHelpMessageError',
      content: exception
    });
  }
};
