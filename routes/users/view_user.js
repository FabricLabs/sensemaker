'use strict';

const { publicUserView, privilegedUserView } = require('../../functions/userPublicView');

module.exports = async function (req, res, next) {
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
    json: async () => {
      const isSelf = req.user && req.user.id != null && Number(req.user.id) === Number(user.id);
      const isAdmin = await this._userHasAdminAccess(req);
      res.send(isSelf || isAdmin ? privilegedUserView(user) : publicUserView(user));
    }
  });
};
