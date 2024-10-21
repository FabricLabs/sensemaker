'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('reporters', function (table) {
    table.increments('id').primary();
    table.text('fabric_id', 64);
    table.integer('harvard_id');
    table.text('name', 2048);
    table.text('name_short', 128);
    table.integer('start_year');
    table.integer('end_year');
  }).createTable('jurisdictions', function (table) {
    table.increments('id').primary();
    table.text('fabric_id', 64);
    table.integer('harvard_id');
    table.text('name', 2048);
    table.text('name_short', 128);
  }).createTable('volumes', function (table) {
    table.increments('id').primary();
    table.text('fabric_id', 64);
    table.text('title');
    table.text('reporter_name');
    table.text('harvard_id');
    table.integer('reporter_id');
    table.integer('jurisdiction_id');
    table.integer('start_year');
    table.integer('end_year');
    table.integer('volume_number');
    table.text('publisher_name');
    table.integer('publication_year');
    table.text('nominative_volume_number');
    table.text('nominative_name');
    table.integer('series_volume_number');
    table.text('harvard_barcode');
    table.text('harvard_reporter_url');
    table.text('harvard_pdf_url');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('reporters').dropTable('jurisdictions').dropTable('volumes');
};
