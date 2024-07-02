'use strict';

module.exports = async function (req, res, next) {

  const courts = await this.db.select('*').from('courts').where({ jurisdiction_id: req.params.jurisdictionID }).orderBy('founded_date', 'desc');

  res.format({
    json: () => {
      res.send(courts);
    },
    html: () => {
      // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
      return res.send(this.applicationString);
    }
  })
}
