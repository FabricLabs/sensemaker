'use strict';


// Components
const MatterNewChat = require('../../components/MatterNewChat');

module.exports = function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    }
  });
};
