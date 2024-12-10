'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const group = await this.db('groups').select('id', 'name', 'description').where('id', req.params.id).first();
      res.json(group);
    }
  });
};
