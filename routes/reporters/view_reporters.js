'use strict';

// Components

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      const reporter = await this.db('reporters').where('id', req.param.id).first();
      res.send(reporter);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
