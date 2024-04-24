'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      try {
        // const messages = await this.db.select('*')
        //   .from('messages')
        //   .where({ conversation_id: req.params.conversation_id })
        //   .orderBy('created_at', 'asc');
        const messages = await this.db('messages')
          .join('users', 'messages.user_id', 'users.id')
          .select('messages.*', 'users.username as sender_username','users.first_name as sender_first_name')
          .where({ 'messages.conversation_id': req.params.conversation_id })
          .orderBy('messages.created_at', 'asc');
        res.send(messages);
      } catch (exception) {
        res.status(503);
        return res.send({
          type: 'Fetch help messages',
          content: exception
        });
      }
    }
  });
};
