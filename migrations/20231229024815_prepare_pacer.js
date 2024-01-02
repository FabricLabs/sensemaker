'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.text('url', 500);
    table.integer('case_count');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.dropColumn('url');
    table.dropColumn('case_count');
  });
};
