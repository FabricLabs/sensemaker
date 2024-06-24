'use strict';

exports.up = function (knex) {
  return knex.schema.table('embeddings', function (table) {
    table.text('text').nullable().alter();
    table.integer('document_id').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table('embeddings', function (table) {
    table.text('text').notNullable().alter();
    table.dropColumn('document_id');
  });
};
