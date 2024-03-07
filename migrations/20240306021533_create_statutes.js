'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('statutes', function (table) {
    table.increments('id').primary();
    table.string('name');
    table.string('description');
    table.string('status').notNullable().defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('hyperlink');
    table.integer('jurisdiction_id').unsigned().notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('statutes');
};
