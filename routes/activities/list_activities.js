'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      const activities = await this.db('activities').select('*');
      res.send(activities);
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
