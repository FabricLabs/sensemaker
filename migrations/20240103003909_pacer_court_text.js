'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.text('pacer_id').alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.integer('pacer_id').alter();
  });
};
