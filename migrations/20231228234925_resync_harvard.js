'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.integer('harvard_id');
  }).alterTable('cases', function (table) {
    table.integer('harvard_id');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.dropColumn('harvard_id');
  }).alterTable('cases', function (table) {
    table.dropColumn('harvard_id');
  });
};
