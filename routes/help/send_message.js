'use strict';

module.exports = async function (req, res) {
  
  try {
    const { content, help_role } = req.body;
    const insert = await this.db('messages').insert({
      user_id: req.user.id,
      content: content,
      conversation_id: req.params.conversation_id,
      help_role: help_role,
    });

    return res.send({
      message: 'Help Message successfully sent',
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
