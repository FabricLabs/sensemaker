'use strict';

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('requests').del();
  await knex('messages').del();
  await knex('conversations').del();
  await knex('users').del();
  await knex('users').insert([
    { id: 1, username: 'sensemaker', email: 'sensemaker@localhost' },
    { id: 2, username: 'Administrator', email: 'root@localhost', is_admin: true },
    { id: 3, username: 'martindale', email: 'eric@ericmartindale.com', is_admin: true, password: '$2b$10$p39AvbqtRbCyhfwtj5z78eE8TFafZVVW1s5SoEegIlCBIyoGGlIUW', salt: '$2b$10$p39AvbqtRbCyhfwtj5z78e' },
  ]);
};
