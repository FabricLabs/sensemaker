'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.boolean('is_compliant').notNullable().defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropColumn('is_compliant');
  });
};
