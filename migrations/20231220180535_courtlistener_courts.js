'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.text('courtlistener_id').defaultTo(null);
    table.text('citation_string').defaultTo(null);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('courts', function (table) {
    table.dropColumn('courtlistener_id');
    table.dropColumn('citation_string');
  });
};
