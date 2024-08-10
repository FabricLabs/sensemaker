'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.boolean('pdf_acquired').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.dropColumn('pdf_acquired');
  });
};
