'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('people', function (table) {
    table.text('name_first').defaultTo(null);
    table.text('name_middle').defaultTo(null);
    table.text('name_last').defaultTo(null);
    table.text('name_suffix').defaultTo(null);
    table.integer('courtlistener_id').defaultTo(null);
    table.integer('is_alias_of').defaultTo(null);
    table.timestamp('date_of_birth').defaultTo(null);
    table.timestamp('date_of_death').defaultTo(null);
    table.timestamp('birth_city').defaultTo(null);
    table.timestamp('birth_state').defaultTo(null);
    table.timestamp('death_city').defaultTo(null);
    table.timestamp('death_state').defaultTo(null);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('people', function (table) {
    table.dropColumn('name_first');
    table.dropColumn('name_middle');
    table.dropColumn('name_last');
    table.dropColumn('name_suffix');
    table.dropColumn('courtlistener_id');
    table.dropColumn('is_alias_of');
    table.dropColumn('date_of_birth');
    table.dropColumn('date_of_death');
    table.dropColumn('birth_city');
    table.dropColumn('birth_state');
    table.dropColumn('death_city');
    table.dropColumn('death_state');
  });
};
