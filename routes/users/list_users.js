'use strict';

const {
  PER_PAGE_LIMIT
} = require('../../constants');

module.exports = function (req, res, next) {
  console.debug('listing users...');

  // Set a timeout for the entire request
  const timeout = setTimeout(() => {
    console.error('[SENSEMAKER]', '[ROUTES]', '[USERS:LIST]', 'Request timed out');
    if (!res.headersSent) {
      res.status(504).send({
        type: 'Fetch users',
        content: 'Request timed out'
      });
    }
  }, 30000); // 30 second timeout

  const perPage = parseInt(req.query.per_page) || PER_PAGE_LIMIT;
  const page = parseInt(req.query.page) || 1;

  // Input validation
  if (perPage <= 0 || page <= 0) {
    clearTimeout(timeout);
    return res.status(400).send({
      type: 'Fetch users',
      content: 'Invalid pagination parameters'
    });
  }

  // Handle only JSON format to avoid complexity
  const query = async () => {
    try {
      console.debug('[SENSEMAKER]', '[ROUTES]', '[USERS:LIST]', 'fetching users...');
      const countPromise = this.db('users').count('* as total').timeout(5000, { cancel: true });
      const usersPromise = this.db('users')
        .select(
          'id',
          'username',
          'email',
          'is_admin',
          'is_compliant',
          'display_name',
          'first_name',
          'last_name',
          'is_beta',
          'created_at',
          'updated_at'
        )
        .orderBy('created_at', 'asc')
        .limit(perPage)
        .offset((page - 1) * perPage)
        .timeout(5000, { cancel: true });

      // Execute both queries in parallel
      const [countResult, users] = await Promise.all([countPromise, usersPromise]);
      const total = parseInt(countResult[0].total);
      clearTimeout(timeout);

      if (!res.headersSent) {
        res.send(users);
      }
    } catch (exception) {
      clearTimeout(timeout);
      console.error('[SENSEMAKER]', '[ROUTES]', '[USERS:LIST]', 'exception:', exception);

      if (!res.headersSent) {
        res.status(503).send({
          type: 'Fetch users',
          content: exception.message || 'Database error'
        });
      }
    }
  };

  // Execute the query
  query().catch(next);
};
