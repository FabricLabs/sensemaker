'use strict';

module.exports = async function (req, res, next) {
  const keys = [];

  res.format({
    json: async () => {
      res.send(keys);
    },
    html: () => {
      return res.send(this.applicationString);
    }
  });
};
