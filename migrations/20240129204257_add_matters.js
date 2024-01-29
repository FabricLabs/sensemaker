'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('matters', function (table) {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('creator').unsigned().references('users.id');
    table.text('title');
    table.text('description');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('matters');
};
