'use strict';

const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const actor = new Actor(req.body);
  res.format({
    json: async () => {
      res.send({ id: actor.id, content: { ...req.body } });
    },
    html: () => {
      return res.send(this.applicationString);
    }
  });
};
