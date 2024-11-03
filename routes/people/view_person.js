'use strict';

module.exports = async function (req, res, next) {
  const person = await this.db.select(
    'id as dbid',
    'fabric_id as id',
    'full_name',
    'name_first',
    'name_middle',
    'name_last',
    'name_suffix',
    'date_of_birth',
    'date_of_death'
  ).from('people').orderBy('name', 'asc').where({ fabric_id: req.params.fabricID }).first();

  res.format({
    json: () => {
      if (!person) return res.status(404).json({ message: 'Person not found.' });
      res.send(person);
    },
    html: () => {
      // TODO: pre-render application with request token, then send that string to the application's `_renderWith` function
      return res.send(this.applicationString);
    }
  });
};
