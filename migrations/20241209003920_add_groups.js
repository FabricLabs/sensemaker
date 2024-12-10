'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('groups', (table) => {
    table.string('id');
    table.increments('dbid');
    table.string('creator');
    table.string('owner');
    table.string('name');
    table.string('description');
    table.string('summary');
    table.timestamps();
  }).createTable('group_members', (table) => {
    table.string('group_id');
    table.string('account_id');
    table.timestamps();
  }).createTable('sources', (table) => {
    table.string('id');
    table.increments('dbid');
    table.string('creator');
    table.string('owner');
    table.string('name');
    table.string('description');
    table.string('content');
    table.string('summary');
    table.string('latest_blob_id');
    table.timestamp('last_retrieved');
    table.enu('status', ['active', 'deleted']);
    table.enum('recurrence', ['daily', 'weekly', 'monthly', 'yearly']).defaultTo('daily');
    table.timestamps();
  }).alterTable('documents', (table) => {
    table.string('blob_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('groups').dropTable('group_members').dropTable('sources').alterTable('documents', (table) => {
    table.dropColumn('blob_id');
  });
};
