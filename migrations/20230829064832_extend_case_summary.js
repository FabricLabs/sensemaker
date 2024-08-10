'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.text('summary', 'text').alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.string('summary');
  });
};
