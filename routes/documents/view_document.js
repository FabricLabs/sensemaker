'use strict';

module.exports = function (req, res, next) {
  console.debug('[SENSEMAKER]', '[HTTP]', 'Viewing document:', req.params.fabricID);
  console.debug('[SENSEMAKER]', '[HTTP]', 'Viewing document params:', req.params);
  res.format({
    json: async () => {
      const document = await this.db('documents').where('fabric_id', req.params.fabricID).orderBy('created_at', 'desc').first();
      res.send(document);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
