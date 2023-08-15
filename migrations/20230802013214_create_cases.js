'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('cases', (table) => {
    table.increments('id').primary();
    table.integer('harvard_case_law_id').unsigned();
    table.string('title').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('cases');
};
