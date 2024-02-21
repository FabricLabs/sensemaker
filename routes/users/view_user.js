'use strict';

module.exports = async function (req, res, next) {
  const user = await this.db('users').where({ id: req.params.id }).first();
  if (!user) {
    res.status(404);
    res.send({ status: 'error', message: 'User not found!' });
    return;
  }

  res.format({
    html: () => {
      res.render(this.applicationString);
    },
    json: () => {
      res.send(user);
    },
  });
};
