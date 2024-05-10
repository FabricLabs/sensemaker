'use strict';

module.exports = function (req, res, next) {
  res.format({
    json:async () => {
      const document = await this.db('documents').select('id', 'description', 'created_at', 'fabric_id', ).where('fabric_id', req.params.fabricID).first();
      res.format({
        json: () => {
          return res.send(document);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    }
  })

};