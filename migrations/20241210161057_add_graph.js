'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('activities', (table) => {
    table.string('id').notNullable();
    table.increments('dbid').primary();
    table.string('name').notNullable();
  }).createTable('actors', (table) => {
    table.string('id').notNullable();
    table.increments('dbid').primary();
    table.string('name').notNullable();
  }).createTable('relationships', (table) => {
    table.string('id').notNullable();
    table.increments('dbid').primary();
    table.integer('origin_id').unsigned().notNullable();
    table.integer('target_id').unsigned().notNullable();
    table.string('label').notNullable();
  }).alterTable('documents', (table) => {
    table.string('mime_type');
    table.json('history');
    table.string('latest_blob_id').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('activities').dropTable('actors').dropTable('relationships').alterTable('documents', (table) => {
    table.dropColumn('history');
    table.dropColumn('latest_blob_id');
    table.dropColumn('mime_type');
  });
};
