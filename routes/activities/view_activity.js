'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      const activity = await this.db('activities').select('*').where('id', req.params.id);
      if (!activity) return res.status(404).send({ error: 'Activity not found.' });
      res.send(activity);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
