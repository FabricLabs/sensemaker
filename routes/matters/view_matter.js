'use strict';

// Components

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      const matter = await this.db('matters').where('id', req.param.id).first();
      res.send(matter);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
