'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('agents', (table) => {
    table.string('id').notNullable();
    table.string('name').notNullable();
    table.string('model').notNullable().defaultTo('sensemaker');
    table.increments('dbid').primary();
    table.enu('status', ['STOPPED', 'STARTED', 'PAUSED', 'ERROR']).notNullable().defaultTo('STOPPED');
    table.string('latest_prompt_blob_id');
    table.json('prompt_blob_history');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('agents');
};
