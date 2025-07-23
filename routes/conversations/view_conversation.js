'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      const conversation = await this.db.select('id', 'title', 'created_at', 'log', 'context').from('conversations')
        .where(function () {
          // TODO: disable raw ID lookup, only allow Fabric ID lookup
          this.where('id', req.params.id).orWhere('fabric_id', req.params.id);
        }).first();

      // 404 Conversation Not Found
      if (!conversation) {
        return res.format({
          json: function () {
            res.status(404).json({ message: 'Conversation not found.' });
          },
          html: function () {
            res.status(404).json({ message: 'Conversation not found.' });
          }
        });
      }

      // Ensure the Message Log exists
      if (!conversation.log) conversation.log = [];

      // Fetch Messages
      const messages = await this.db('messages')
        .whereIn('id', conversation.log)
        .select('id', 'content', 'created_at');
      conversation.messages = messages;

      // Send response
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
