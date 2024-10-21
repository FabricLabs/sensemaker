'use strict';

exports.up = function (knex) {
  return knex.schema.table('documents', function (table) {
    table.enum('status', ['draft', 'published']);
    table.integer('creator').unsigned();
  });
};

exports.down = function (knex) {
  return knex.schema.table('documents', function (table) {
    table.dropColumn('status');
    table.dropColumn('creator');
  });
};
