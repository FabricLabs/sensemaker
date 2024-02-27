'use strict';


// Components
const MatterNewChat = require('../../components/MatterNewChat');

module.exports = function (req, res, next) {
  res.format({

    // html: () => {
    //   // TODO: import auth token, load data
    //   const page = new MatterNewChat({});
    //   const output = page.toHTML();
    //   return res.send(this.http.app._renderWith(output));
    // }
    html: () => {
      res.send(this.applicationString);
    }
  });
};
