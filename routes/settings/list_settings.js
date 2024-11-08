'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: () => {
      return res.send({
        name: this.name,
        version: this.version
      });
    },
    html: () => {
      return res.send(this.applicationString);
    }
  })
};
