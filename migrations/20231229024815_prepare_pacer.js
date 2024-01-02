'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.integer('case_count');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.dropColumn('case_count');
  });
};
