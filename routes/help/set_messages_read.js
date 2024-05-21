'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      try {
        const { help_role } = req.body;

        const update = await this.db('messages')
          .where({ conversation_id: req.params.conversation_id })
          .where({ help_role: help_role })
          .update({
            is_read: 1,
            updated_at: new Date(),
          });

        res.send('updated');
      } catch (exception) {
        res.status(503).send({
          type: 'Mark read messages failure',
          content: exception.message
        });
      }
    }
  });
};
