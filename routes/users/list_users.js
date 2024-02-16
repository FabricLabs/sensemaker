'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      try {
        const users = await this.db.select(
          'id',
          'username',
          'email',
          'is_admin',
          'is_compliant',
          'display_name',
          'first_name',
          'last_name',
          'firm_name',
          'is_beta',
          'created_at',
          'updated_at'
        ).from('users');
        res.send(users);
      } catch (exception) {
        res.status(503);
        return res.send({
          type: 'Fetch users',
          content: exception
        });
      }
    }
  });
};
