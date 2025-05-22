'use strict';

module.exports = function (req, res) {
  res.format({
    json: () => {
      const topics = ['global'];
      res.json(topics[0]);
    },
    html: () => {
      return res.send(this.applicationString);
    }
  })
};
