'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('courts', function (table) {
    table.increments('id').primary();
    table.text('fabric_id').notNullable();
    table.text('name').notNullable();
    table.text('slug').notNullable();
    table.text('short_name').notNullable();
    table.date('founded_date').defaultTo(null);
    table.timestamp('last_harvard_crawl').defaultTo(null);
    table.timestamp('last_courtlistener_crawl').defaultTo(null);
    table.timestamps(true, true);
  }).alterTable('cases', function (table) {
    table.integer('court_id').unsigned().references('courts.id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('courts').alterTable('cases', function (table) {
    table.dropColumn('court_id');
  });
};
