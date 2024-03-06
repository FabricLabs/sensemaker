'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('courts', (table) => {
    table.integer('jurisdiction_id').unsigned().references('id').inTable('jurisdictions');
  }).createTable('reporter_jurisdictions', (table) => {
    table.integer('reporter_id').unsigned().references('id').inTable('reporters');
    table.integer('jurisdiction_id').unsigned().references('id').inTable('jurisdictions');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('courts', (table) => {
    table.dropForeign('jurisdiction_id');
    table.dropColumn('jurisdiction_id');
  }).alterTable('reporter_jurisdictions', (table) => {
    table.dropForeign('reporter_id');
    table.dropForeign('jurisdiction_id');
  });
};
