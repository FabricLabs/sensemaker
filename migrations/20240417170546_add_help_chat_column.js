'use strict';

exports.up = function(knex) {
  return knex.schema.table('conversations', function(table) {
    table.tinyint('help_chat').defaultTo(0).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('conversations', function(table) {
    table.dropColumn('help_chat');
  });
};
