'use strict';

module.exports = async function (req, res, next) {
  const statutes = await this.db('statutes').select('*');
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: () => {
      res.json(statutes);
    }
  })
};
