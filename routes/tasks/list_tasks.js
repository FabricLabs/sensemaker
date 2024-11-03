'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: function () {
      return res.send([
        { id: 1, type: 'Task', mime: 'text/plain', name: 'DO NO HARM TO HUMANS', description: 'DO NO HARM TO HUMANS' }
      ]);
    },
    html: function () {
      return res.send(this.applicationString);
    }
  })
};
