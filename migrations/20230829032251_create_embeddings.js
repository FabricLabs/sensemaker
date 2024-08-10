'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('embeddings', (table) => {
    table.increments('id').primary();
    table.string('text').notNullable();
    table.string('model').notNullable().default('text-embedding-ada-002');
    table.json('content').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('embeddings');
};
