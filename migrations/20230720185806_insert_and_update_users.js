'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.string('email');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropColumn('email');
  });
};
