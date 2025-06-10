'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('announcements', function (table) {
    table.timestamp('expiration_date').nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('announcements', function (table) {
    table.date('expiration_date').nullable().alter();
  });
};
