'use strict';
// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      try {
        const conversations = await this.db.select('*')
          .from('conversations')
          .where({ help_chat: 1 })
          .where({ creator_id: req.user.id })
          .orderBy('created_at', 'desc')
          .paginate({
            perPage: PER_PAGE_LIMIT,
            currentPage: 1
          });
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
