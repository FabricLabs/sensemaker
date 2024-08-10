'use strict';

exports.up = function(knex) {
  return knex.schema.alterTable('messages', function (table) {
    table.text('content', 'text').alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('messages', function(table) {
    table.string('content').notNullable();
  });
};
