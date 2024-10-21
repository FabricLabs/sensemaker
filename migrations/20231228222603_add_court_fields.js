'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.integer('pacer_id');
    table.text('url', 500);
    table.date('start_date');
    table.date('end_date');
    table.text('jurisdiction', 3);
    table.text('notes');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.dropColumn('pacer_id');
    table.dropColumn('url');
    table.dropColumn('start_date');
    table.dropColumn('end_date');
    table.dropColumn('jurisdiction');
    table.dropColumn('notes');
  });
};
