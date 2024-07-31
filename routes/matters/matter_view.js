'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      const matter = await this.db('matters').select('*').where('id', req.params.id).first();
      if (matter.creator == req.user.id) {
        res.send(matter);
      } else {
        res.status(401);
        return res.send({
          type: 'FetchMatchError',
          content: 'Invalid Matter'
        });
      }
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
