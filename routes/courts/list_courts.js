'use strict';

module.exports = async function (req, res, next) {
  const currentPage = req.query.page || 1;
  const courts = await this.db.select('id', 'fabric_id', 'slug', 'name', 'short_name', 'founded_date', 'jurisdiction_id', 'courtlistener_id', 'pacer_id', 'start_date', 'end_date', 'url').from('courts').orderBy('founded_date', 'desc').paginate({
    perPage: PER_PAGE_LIMIT,
    currentPage: currentPage
  });

  res.format({
    json: () => {
      res.send(courts.data);
    },
    html: () => {
      // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
      return res.send(this.applicationString);
    }
  })
}
