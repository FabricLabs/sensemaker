'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      return res.send(topics);
    },
    html: () => {
      return res.send(this.applicationString);
    }
  })
};
