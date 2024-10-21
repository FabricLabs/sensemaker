'use strict'

exports.up = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.enum('help_role', ['user', 'admin']).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('messages', function(table) {
    table.dropColumn('help_role');
  });
};
