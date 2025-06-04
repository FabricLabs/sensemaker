'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: () => {
      res.send({
        message: 'Memory viewing is not yet implemented.'
      });
    },
    html: () => {
      return res.send(this.applicationString);
    }
  })
}
