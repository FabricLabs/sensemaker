'use strict';

exports.up = function(knex) {
  return knex.schema.table('conversations', function(table) {
    table.string('file_fabric_id', 64);
  });
};

exports.down = function(knex) {
  return knex.schema.table('conversations', function(table) {
    table.dropColumn('file_fabric_id');
  });
};
