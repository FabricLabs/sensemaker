'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('applications', (table) => {
    table.increments('id').primary();
    table.string('client_id', 128).notNullable().unique();
    table.integer('owner_id').unsigned().notNullable().index();
    table.string('name', 128).notNullable();
    table.text('description');
    table.string('homepage_url', 512).nullable();
    table.string('icon_url', 512).nullable();
    table.string('type', 16).notNullable().defaultTo('confidential');
    table.string('pubkey', 66).nullable();
    table.string('token_endpoint_auth_method', 32).notNullable().defaultTo('fabric_bip340');
    table.text('redirect_uris');
    table.text('grant_types');
    table.text('scopes');
    table.string('status', 16).notNullable().defaultTo('active').index();
    table.timestamps(true, true);
  }).createTable('application_authorizations', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().index();
    table.integer('application_id').unsigned().notNullable().index();
    table.text('scopes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('revoked_at').nullable();
  }).createTable('application_tokens', (table) => {
    table.increments('id').primary();
    table.string('token_hash', 64).notNullable().unique();
    table.integer('application_id').unsigned().notNullable().index();
    table.integer('user_id').unsigned().nullable().index();
    table.text('scope');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').nullable();
    table.timestamp('revoked_at').nullable();
    table.string('replaced_by', 64).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('application_tokens')
    .dropTableIfExists('application_authorizations')
    .dropTableIfExists('applications');
};
