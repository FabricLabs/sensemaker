'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('agents', (table) => {
    table.string('id').notNullable();
    table.string('name').notNullable();
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
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('agents');
};
