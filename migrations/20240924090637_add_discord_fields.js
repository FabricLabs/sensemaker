'use strict';

exports.up = function (knex) {
  return knex.schema.table('conversations', function (table) {
    table.text('discord_id');
    table.text('fabric_id');
  }).table('messages', function (table) {
    table.text('discord_id');
  }).table('users', function (table) {
    table.text('discord_id');
    table.text('discord_token_id');
    table.text('fabric_id');
  }).createTable('credentials', function (table) {
    table.increments('id').primary();
    table.text('type');
    table.text('content');
    table.text('user_id');
    table.timestamps(true, true);
    table.text('max_age');
    table.text('expires_in');
    table.text('expires_at');
    table.text('refresh_token');
    table.text('scope');
  }).createTable('identities', function (table) {
    table.increments('id').primary();
    table.text('fabric_id');
    table.text('user_id');
    table.text('uid'); // upstream ID
    table.text('type');
    table.text('source');
    table.text('content');
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.table('conversations', function (table) {
    table.dropColumn('discord_id');
    table.dropColumn('fabric_id');
  }).table('messages', function (table) {
    table.dropColumn('discord_id');
  }).table('users', function (table) {
    table.dropColumn('discord_id');
    table.dropColumn('discord_token_id');
    table.dropColumn('fabric_id');
  }).dropTable('credentials').dropTable('identities');
};
