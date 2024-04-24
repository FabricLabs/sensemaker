'use strict';

module.exports = function (req, res, next) {
  res.format({
    json:async () => {
      const instance = await this.db.select('id', 'harvard_case_law_pdf').from('cases').where({ id: req.params.id, pdf_acquired: true }).first();
      if (!instance || !instance.harvard_case_law_pdf) res.end(404);
      /* const pdf = fs.readFileSync(`./stores/harvard/${instance.harvard_case_law_id}.pdf`);
      res.send(pdf); */
      res.redirect(instance.harvard_case_law_pdf);
    }
  })
};