'use strict';

exports.up = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.tinyint('is_read').defaultTo(0).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.dropColumn('is_read');
  });
};
