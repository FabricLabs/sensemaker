'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('files', function (table) {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('creator').unsigned().references('users.id');
    table.text('name').notNullable(); // original file name
    table.text('path').notNullable(); // relative to the storage root
    table.text('type').notNullable(); // mime type
    table.text('relates_to');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('files');
};
