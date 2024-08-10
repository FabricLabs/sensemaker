'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('responses', (table) => {
    table.increments('id').primary();
    table.string('actor').notNullable();
    table.string('content').notNullable();
    table.timestamps(true, true);
  }).alterTable('requests', function (table) {
    table.integer('response_id').unsigned().references('id').inTable('responses');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('responses', function (table) {
    table.dropColumn('conversation_id');
  }).dropTable('responses');
};
