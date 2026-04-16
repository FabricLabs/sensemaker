'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      if (!req.user || req.user.id == null) {
        return res.status(401).json({ message: 'Authentication required.' });
      }

      const conversation = await this.db.select('id', 'creator_id', 'title', 'created_at', 'log').from('conversations').where({ id: req.params.id }).first();
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found.' });
      }

      if (!(await this._userCanAccessConversation(req, conversation))) {
        return res.status(403).json({ message: 'Not allowed to view this conversation.' });
      }

      if (!conversation.log) conversation.log = [];
      const messages = await this.db('messages')
        .whereIn('id', conversation.log)
        .select('id', 'content', 'created_at');

      conversation.messages = messages;

      res.format({
        json: () => {
          res.send(conversation);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    }
  })

};
