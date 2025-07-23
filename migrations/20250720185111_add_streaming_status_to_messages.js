'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('messages', (table) => {
    table.enu('status', ['ready', 'computing', 'streaming']).defaultTo('ready').alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('messages', (table) => {
    table.enu('status', ['ready', 'computing']).defaultTo('ready').alter();
  });
};
