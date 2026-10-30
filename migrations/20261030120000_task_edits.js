'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('task_edits', (table) => {
    table.increments('id').primary();
    table.string('fabric_id', 128).notNullable().index();
    table.integer('owner').unsigned().notNullable().index();
    table.text('patch').notNullable();
    table.string('status', 16).notNullable().defaultTo('pending').index();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('task_edits');
};
