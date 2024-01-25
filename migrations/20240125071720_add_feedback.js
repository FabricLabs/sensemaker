'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('feedback', function (table) {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('creator').unsigned().references('users.id');
    table.integer('conversation_id').unsigned().references('conversations.id');
    table.text('relates_to');
    table.text('content', 'mediumtext').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('feedback');
};
