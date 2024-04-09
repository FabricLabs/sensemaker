'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      try {
        const court = await this.db('courts').select('*').where('slug', req.params.id).first();
        res.send(court);
      } catch (exception) {
        res.status(503);
        return res.send({
          type: 'Fetch court',
          content: exception
        });
      }
    }
  });
};
