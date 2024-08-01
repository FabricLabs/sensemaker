'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.string('summary');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.dropColumn('summary');
  });
};
