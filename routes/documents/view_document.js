'use strict';

module.exports = function (req, res, next) {
  console.debug('[NOVO]', '[HTTP]', 'Viewing document:', req.param.id);
  console.debug('[NOVO]', '[HTTP]', 'Viewing document params:', req.params);
  res.format({
    json: async () => {
      const document = await this.db('documents').where('fabric_id', req.param.id).orderBy('created_at', 'desc').first();
      res.send(document);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
