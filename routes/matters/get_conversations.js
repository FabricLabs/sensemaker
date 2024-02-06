'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      try {
        console.log("esta es la func de get",req.params.id, req.user.id)
        const conversations = await this.db('conversations').select('*').where({matter_id: req.params.id, creator_id: req.user.id});
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
