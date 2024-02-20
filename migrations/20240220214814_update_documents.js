'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.string('encoding').defaultTo('utf8');
    table.string('title').defaultTo('Untitled Document');
    table.string('filename');
    table.integer('owner');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.dropColumn('encoding');
    table.dropColumn('title');
    table.dropColumn('filename');
    table.dropColumn('owner');
  });
};
