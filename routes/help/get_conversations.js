'use strict';
// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      try {
        const conversations = await this.db('conversations')
          .where({ help_chat: 1, creator_id: req.user.id })
          .orderBy('updated_at', 'desc');

        // Fetch the last message for each conversation
        for (let conversation of conversations) {
          const lastMessage = await this.db('messages')
            .where({ conversation_id: conversation.id })
            .orderBy('created_at', 'desc')
            .first();
            
          conversation.last_message = lastMessage;
        }
        res.send(conversations);
      } catch (exception) {
        res.status(503);
        return res.send({
          type: 'Fetch help conversations',
          content: exception
        });
      }
    }
  });
};
