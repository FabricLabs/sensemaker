'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('requests', function (table) {
    table.integer('conversation_id').unsigned().references('id').inTable('conversations');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('requests', function (table) {
    table.dropColumn('conversation_id');
  });
};
