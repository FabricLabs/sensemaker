'use strict';

module.exports = function (req, res, next) {
    let messages = [];
    res.format({
      json: async () => {
        if (req.query.conversation_id) {
          const conversation = await this.db('conversations').select('id').where({ fabric_id: req.query.conversation_id }).first();
          if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
          messages = await this.db('messages').join('users', 'messages.user_id', '=', 'users.id').select(
            'users.username',
            'messages.id as dbid',
            'messages.fabric_id as id',
            'messages.user_id',
            'messages.created_at',
            'messages.updated_at',
            'messages.content',
            'messages.status',
            'messages.attachments',
            'messages.cards'
          ).where({
            conversation_id: conversation.id
          }).orderBy('created_at', 'asc');
        } else {
          // messages = await this.db.select('id', 'created_at', 'content').from('messages').orderBy('created_at', 'asc');
        }
    
        messages = messages.map((m) => {
          return { ...m, author: m.username || 'User #' + m.user_id, role: (m.user_id == 1) ? 'assistant' : 'user' };
        });
    
        res.send(messages);
    }})
  };
