'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('people', function (table) {
    table.text('date_of_birth').defaultTo(null).alter();
    table.text('date_of_death').defaultTo(null).alter();
    table.text('birth_city').defaultTo(null).alter();
    table.text('birth_state').defaultTo(null).alter();
    table.text('death_city').defaultTo(null).alter();
    table.text('death_state').defaultTo(null).alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('people', function (table) {
    table.timestamp('date_of_birth').defaultTo(null).alter();
    table.timestamp('date_of_death').defaultTo(null).alter();
    table.timestamp('birth_city').defaultTo(null).alter();
    table.timestamp('birth_state').defaultTo(null).alter();
    table.timestamp('death_city').defaultTo(null).alter();
    table.timestamp('death_state').defaultTo(null).alter();
    table.timestamps(true, true);
  });
};
