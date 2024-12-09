'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const source = await this.db('sources').select('id', 'name', 'description', 'content', 'recurrence', 'last_retrieved', 'owner').where('id', req.params.id).first();
      if (req.user.fabric_id == source.owner) source.can_edit = true;
      res.json(source);
    }
  });
};
