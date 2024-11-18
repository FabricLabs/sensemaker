'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.text('fabric_id');
    table.timestamps(true, true);
    table.timestamp('completed_at');
    table.integer('creator').unsigned().notNullable();
    table.integer('owner').unsigned().notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.text('due_date');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('tasks');
};
