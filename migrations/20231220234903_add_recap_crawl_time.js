'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.timestamp('last_recap_crawl').defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.dropColumn('last_recap_crawl');
  });
};
