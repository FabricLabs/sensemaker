'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('reviews', function (table) {
    table.integer('rating').unsigned();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('reviews', function (table) {
    table.dropColumn('rating');
  });
};
