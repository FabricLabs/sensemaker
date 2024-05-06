'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      try {
        const user = await this.db.select('is_admin').from('users').where({ id: req.user.id }).first();
        if (!user || user.is_admin !== 1) {
          return res.status(401).json({ message: 'User not allowed to get Help conversations.' });
        }
        const conversations = await this.db('conversations')
          .join('users', 'conversations.creator_id', '=', 'users.id')
          .select(
            'conversations.*',
            'users.id as creator_id',
            'users.username as creator_username',
            'users.first_name as creator_first_name'
          )
          .where({ 'conversations.help_chat': 1 })
          .orderBy('conversations.updated_at', 'desc');

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
