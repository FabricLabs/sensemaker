'use strict';


module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      const document = await this.db('documents').where('fabric_id', req.params.id).orderBy('created_at','desc').first();
      res.send(document);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
