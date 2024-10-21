'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.string('fabric_id', 64).unique();
    table.index('fabric_id');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.dropIndex('fabric_id');
    table.dropColumn('fabric_id');
  });
};
