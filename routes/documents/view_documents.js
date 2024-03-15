'use strict';

// Components

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      const document = await this.db('documents').where('id', req.param.id).first();
      res.send(document);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
