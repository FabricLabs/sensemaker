'use strict';

module.exports = function (req, res, next) {
  res.format({
    json:async () => {
      const court = await this.db.select('id', 'fabric_id', 'slug', 'name', 'short_name', 'founded_date', 'courtlistener_id', 'pacer_id', 'start_date', 'end_date').from('courts').where({ slug: req.params.slug }).first();
      res.format({
        json: () => {
          if (!court) return res.status(404).json({ message: 'Court not found.' });
          res.send(court);
        },
        html: () => {
          // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
          return res.send(this.applicationString);
        }
      });
    }
  })
};