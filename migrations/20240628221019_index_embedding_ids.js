'use strict';

exports.up = function (knex) {
  return knex.schema.table('files', function (table) {
    table.integer('embedding_id').unsigned();
    table.index('embedding_id');
  }).table('documents', function (table) {
    table.integer('embedding_id').unsigned();
    table.index('embedding_id');
  });
};

exports.down = function (knex) {
  return knex.schema.table('files', function (table) {
    table.dropIndex('embedding_id');
    table.dropColumn('embedding_id');
  }).table('documents', function (table) {
    table.dropIndex('embedding_id');
    table.dropColumn('embedding_id');
  });
};
