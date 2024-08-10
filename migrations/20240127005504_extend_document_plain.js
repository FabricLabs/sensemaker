'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.text('plain_text', 'mediumtext').defaultTo(null).alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.text('plain_text').defaultTo(null).alter();
  });
};
