'use strict';
const {
  PER_PAGE_LIMIT
} = require('../../constants');

module.exports = function (req, res, next) {
  const perPage = PER_PAGE_LIMIT;
  const page = req.query.page || 1;

  res.format({
    json: async () => {
      // TODO: pagination
      try {
        const users = await this.db('users').select(
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
        ).orderBy('created_at', 'asc').paginate({ perPage, currentPage: page });
        res.send(users.data);
      } catch (exception) {
        console.error('[JEEVES]', '[ROUTES]', '[USERS:LIST]', 'exception:', exception);
        res.status(503);
        return res.send({
          type: 'Fetch users',
          content: exception
        });
      }
    }
  });
};
