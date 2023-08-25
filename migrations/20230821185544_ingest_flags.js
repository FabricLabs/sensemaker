'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.boolean('pdf_acquired').notNullable().defaultTo(false);
    table.boolean('pdf_ingested').notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.dropColumn('pdf_acquired');
    table.dropColumn('pdf_ingested');
  });
};
