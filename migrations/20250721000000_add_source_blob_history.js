'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('sources', function (table) {
    table.json('blob_history').nullable(); // JSON array of blob fabric_ids from this source
    table.text('last_error').nullable(); // Last error message from failed sync attempts
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('sources', function (table) {
    table.dropColumn('blob_history');
    table.dropColumn('last_error');
  });
};

