'use strict';

exports.up = function(knex) {
  return knex.schema.alterTable('documents', function(table) {
    table.integer('file_id').unsigned();
    table.foreign('file_id').references('id').inTable('files'); //this is the ID asigned to the file when adding it to table 'files'
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('documents', function(table) {
    table.dropForeign('file_id');
    table.dropColumn('file_id');
  });
};
