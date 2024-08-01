'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.text('title', 'text').alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.string('title').notNullable();
  });
};
