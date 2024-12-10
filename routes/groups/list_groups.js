'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const groups = await this.db('groups').select('id', 'name', 'description').orderBy('updated_at', 'desc');
      res.json(groups);
    }
  });
};
