'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      res.send(this.features);
    },
    html: () => {
      return res.send(this.applicationString);
    }
  });
};
