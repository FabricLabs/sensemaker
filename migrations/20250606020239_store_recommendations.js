'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('tasks', function (table) {
    table.text('recommendation').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('tasks', function (table) {
    table.dropColumn('recommendation');
  });
};
