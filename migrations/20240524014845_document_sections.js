'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('document_sections', function (table) {
    table.increments('id').primary();
    table.integer('document_id').notNullable();
    table.integer('section_number').notNullable();
    table.string('title', 200);
    table.text('content');
    table.string('status', 20).defaultTo('draft');
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('document_sections');
};
