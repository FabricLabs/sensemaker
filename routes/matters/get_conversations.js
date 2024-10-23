'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      try {
        const conversations = await this.db.select('*')
          .from('conversations')
          .where({ matter_id: req.params.matterID })
          .where({ creator_id: req.user.id })
          .orderBy('created_at', 'desc');
        res.send(conversations);
      } catch (exception) {
        res.status(503);
        return res.send({
          type: 'Fetch matter conversations',
          content: exception
        });
      }
    }
  });
};