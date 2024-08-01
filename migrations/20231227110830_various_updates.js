/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('invitations', function (table) {
    table.enu('status', ['pending', 'accepted', 'declined']).defaultTo('pending');
  }).alterTable('users', function (table) {
    table.text('display_name');
  }).createTable('judges', function (table) {
    table.increments('id').primary();
    table.integer('person_id').unsigned().notNullable();
    table.foreign('person_id').references('people.id');
    table.text('name');
    table.text('email');
    table.text('phone');
    table.text('address');
    table.text('notes');
    table.text('name_first');
    table.text('name_middle');
    table.text('name_last');
    table.text('name_suffix');
    table.text('name_nickname');
    table.timestamps(true, true);
  }).alterTable('people', function (table) {
    table.text('fabric_id', 64);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('invitations', function (table) {
    table.dropColumn('status');
  }).alterTable('users', function (table) {
    table.dropColumn('display_name');
  }).dropTable('judges').alterTable('people', function (table) {
    table.dropColumn('fabric_id');
  });
};
