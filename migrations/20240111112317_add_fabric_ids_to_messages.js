'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('messages', function (table) {
    table.text('fabric_id', 64);
    table.json('cards');
    table.index(knex.raw('fabric_id(64)'), 'messages_fabric_id_index');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('messages', function (table) {
    table.dropColumn('fabric_id');
    table.dropColumn('cards');
    table.dropIndex('', 'messages_fabric_id_index');
  });
};
