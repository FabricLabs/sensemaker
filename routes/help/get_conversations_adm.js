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
          .select('*')
          .where({ help_chat: 1 })
          .orderBy('created_at', 'desc');

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
