'use strict';

module.exports = async function (req, res, next) {
  res.format({  
    html: () => {
      // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
      return res.send(this.applicationString);
    }
  })
}
