'use strict';

module.exports = async function (req, res, next) {
  const sections = await this.db.select('*').from('document_sections').where('document_id', req.params.document_id).orderBy('section_number', 'desc');

  res.format({
    json: () => {
      res.send(sections);
    },
    html: () => {
      // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
      return res.send(this.applicationString);
    }
  })
}
