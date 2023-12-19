'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('messages', function (table) {
    table.enu('status', ['ready', 'computing']).defaultTo('ready');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('messages', function (table) {
    table.dropColumn('status');
  });
};
