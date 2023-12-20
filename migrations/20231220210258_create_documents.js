'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('documents', (table) => {
    table.increments('id').primary();
    table.string('fabric_id', 64);
    table.string('sha1', 40);
    table.string('sha256', 64);
    table.integer('file_size');
    table.timestamp('date_created');
    table.timestamp('date_modified');
    table.timestamp('date_uploaded');
    table.string('pacer_doc_id', 32);
    table.integer('page_count');
    table.boolean('is_available');
    table.boolean('is_sealed');
    table.text('description');
    table.integer('courtlistener_id');
    table.string('courtlistener_filepath_local', 1000);
    table.string('courtlistener_filepath_ia', 1000);
    table.integer('courtlistener_ocr_status');
    table.string('courtlistener_thumbnail', 100);
    table.text('plain_text');
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('documents');
};
