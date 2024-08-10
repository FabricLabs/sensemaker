'use strict';

module.exports = async function (req, res, next) {
  /* if (!req.user || !req.user.id) {
    res.status(403);
    res.send({ status: 'error', message: 'Unauthorized!' });
    return;
  } */

  const user = await this.db('users').where({ username: req.params.username }).first();

  if (!user) {
    res.status(404);
    res.send({ status: 'error', message: 'User not found!' });
    return;
  }

  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: () => {
      res.send(user);
    },
  });
};
