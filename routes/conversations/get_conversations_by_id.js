'use strict';

module.exports = async function (req, res, next) {
  const conversation = await this.db.select('id', 'title', 'created_at', 'log').from('conversations').where({ id: req.params.id }).first();
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
};
