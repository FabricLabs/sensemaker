'use strict';

exports.seed = async function (knex) {
  await knex('users').insert([
    { id: 1, username: 'sensemaker', email: 'sensemaker@localhost' },
    { id: 2, username: 'Administrator', email: 'root@localhost', is_admin: true }
  ]);
};
