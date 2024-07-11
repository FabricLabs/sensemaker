'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('blobs', function (table) {
    table.increments('id').primary();
    table.string('fabric_id').notNullable();
    table.string('mime_type').notNullable();
    table.longtext('content').notNullable();
    table.timestamps();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('blobs');
};
