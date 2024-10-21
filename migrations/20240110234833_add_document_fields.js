'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.text('content', 'longtext');
    table.text('html', 'mediumtext');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.dropColumn('html');
    table.dropColumn('content');
  });
};
