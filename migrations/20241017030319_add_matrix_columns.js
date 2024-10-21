'use strict';

exports.up = function (knex) {
  return knex.schema.table('conversations', function (table) {
    table.text('matrix_id');
  }).table('messages', function (table) {
    table.text('matrix_id');
  }).table('users', function (table) {
    table.text('matrix_id');
    table.text('matrix_token_id');
  });
};

exports.down = function (knex) {
  return knex.schema.table('conversations', function (table) {
    table.dropColumn('matrix_id');
  }).table('messages', function (table) {
    table.dropColumn('matrix_id');
  }).table('users', function (table) {
    table.dropColumn('matrix_id');
    table.dropColumn('matrix_token_id');
  });
};
