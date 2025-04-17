'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('agents', (table) => {
    table.string('id').notNullable();
    table.string('name').notNullable();
    table.integer('user_id');
    table.enu('type', ['simple', 'network']).notNullable().defaultTo('simple');
    table.string('model').notNullable().defaultTo('sensemaker');
    table.increments('dbid').primary();
    table.enu('status', ['STOPPED', 'STARTED', 'PAUSED', 'ERROR']).notNullable().defaultTo('STOPPED');
    table.string('description');
    table.integer('creator');
    table.integer('owner');
    table.json('prompt_blob_history');
    table.string('latest_prompt_blob_id');
    table.timestamps(true, true);
  }).alterTable('conversations', (table) => {
    table.string('agent_id');
    table.enu('type', ['internal', 'private', 'public', 'global']).notNullable().defaultTo('private');
  }).alterTable('group_members', (table) => {
    table.integer('user_id');
  }).alterTable('files', (table) => {
    table.string('fabric_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('agents').alterTable('conversations', (table) => {
    table.dropColumn('agent_id');
  }).alterTable('group_members', (table) => {
    table.dropColumn('user_id');
  }).alterTable('files', (table) => {
    table.dropColumn('fabric_id');
  }).alterTable('conversations', (table) => {
    table.dropColumn('type');
  });
};
