'use strict';

module.exports = async function (req, res, next) {
  console.log('Fetching alerts for user:', req.user.id);
  const alerts = await this.db('alerts')
    .where('user_id', req.user.id)
    .orderBy('created_at', 'desc')
    .limit(50);

  res.format({
    json: function () {
      res.json(alerts);
    },
    html: () => {
      return res.send(this.applicationString);
    },
  });
};
