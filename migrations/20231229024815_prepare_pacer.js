'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.date('start_date');
    table.date('end_date');
    table.text('url', 500);
    table.integer('case_count');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.dropColumn('start_date');
    table.dropColumn('end_date');
    table.dropColumn('url');
    table.dropColumn('case_count');
  });
};
