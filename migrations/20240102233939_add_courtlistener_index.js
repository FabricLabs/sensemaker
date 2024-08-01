'use strict';

exports.up = function(knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.index('courtlistener_id');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.dropIndex('courtlistener_id');
  });
};
