'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('opinions', function (table) {
    table.mediumtext('html_with_citations').alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('opinions', function (table) {
    table.text('html_with_citations').alter();
  });
};
