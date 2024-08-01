'use strict';

exports.up = function (knex) {
  return knex.schema.table('conversations', function (table) {
    table.text('summary');
  });
};

exports.down = function (knex) {
  return knex.schema.table('conversations', function (table) {
    table.dropColumn('summary');
  });
};
