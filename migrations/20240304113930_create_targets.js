'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('targets', function (table) {
    table.increments('id').primary();
    table.string('name');
    table.string('description');
    table.string('type').notNullable().defaultTo('hyperlink');
    table.string('link');
    table.string('status').notNullable().defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('creator_id').unsigned().notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('targets');
};
