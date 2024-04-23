'use strict';
// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      console.log('empieza la busqueda por db')
      try {
        const conversations = await this.db('conversations')
          .select('*')
          .where({ help_chat: 1 })
          .where({ creator_id: req.user.id })
          .orderBy('created_at', 'desc');

          console.log(conversations);
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
