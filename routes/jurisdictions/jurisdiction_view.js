'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      try {
        const jurisdiction = await this.db('jurisdictions').select('*').where('id', req.params.id).first();
        res.send(jurisdiction);
      } catch (exception) {
        res.status(503);
        return res.send({
          type: 'Fetch Jurisdiction',
          content: exception
        });
      }
    }
  });
};
