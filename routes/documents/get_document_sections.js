'use strict';

module.exports = async function (req, res, next) {

  const document = await this.db('documents').where({ fabric_id: req.params.fabricID }).first();

  if (!document) {
    return res.status(404).json({ status: 'error', message: 'Document not found.' });
  }

  const sections = await this.db.select('*').from('document_sections').where('document_id', document.id).whereNot('status','deleted').orderBy('section_number', 'asc');

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
