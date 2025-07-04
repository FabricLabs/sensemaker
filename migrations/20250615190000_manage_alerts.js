'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('alerts', function(table) {
    table.increments('id').primary();
    table.string('fabric_id').notNullable();
    table.integer('user_id');
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.string('type').defaultTo('info');
    table.string('topic').nullable();
    table.jsonb('trigger').nullable();
    table.boolean('read').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('created_at');
    table.index('read');
  }).createTable('triggers', function(table) {
    table.increments('id').primary();
    table.string('fabric_id').notNullable();
    table.integer('user_id').notNullable();
    table.string('name').notNullable();
    table.string('status').notNullable().defaultTo('active');
    table.text('description').nullable();
    table.string('type').notNullable(); // threshold, schedule, event, keyword, topic
    table.jsonb('config').notNullable(); // Configuration specific to trigger type
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('last_triggered_at').nullable();

    // Indexes
    table.index('user_id');
    table.index('type');
    table.index('active');
    table.index('last_triggered_at');
  }).createTable('settings', function(table) {
    table.increments('id').primary();
    table.string('fabric_id').notNullable();
    table.string('type').notNullable().defaultTo('GLOBAL');
    table.string('name').notNullable();
    table.string('value').notNullable();
    table.integer('user_id').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  }).raw('ALTER TABLE blobs MODIFY content LONGBLOB NOT NULL').alterTable('blobs', function(table) {
    table.index('fabric_id'); // Critical: fixes slow blob lookups (avg 2.1s -> <0.1s)
    table.index('preimage_sha256');
  }).alterTable('documents', function(table) {
    table.index('latest_blob_id');
    table.index('fabric_id'); // Critical: fixes slow document lookups (avg 3.6s -> <0.1s)
    table.boolean('pinned').defaultTo(false);
    table.index('pinned'); // Index for efficient filtering of pinned documents
    table.jsonb('folders').nullable(); // JSON field to store folder IDs containing this document
  }).alterTable('sources', function(table) {
    table.index(['status', 'last_retrieved', 'recurrence']); // Composite index for complex date queries
  }).alterTable('conversations', function(table) {
    table.boolean('pinned').defaultTo(false);
    table.jsonb('context').nullable(); // Add context field to store conversation context
    table.index('pinned'); // Index for efficient filtering of pinned conversations
  }).createTable('invoices', function(table) {
    table.increments('id').primary();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('address').notNullable();
    table.decimal('amount', 18, 8);
    table.string('currency').notNullable().defaultTo('BTC');
    table.text('description');
    table.string('status').defaultTo('pending');
    table.timestamp('due_date');
    table.timestamp('paid_at').nullable();
    table.jsonb('metadata').nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('alerts').dropTable('triggers').dropTable('settings').dropTable('invoices').alterTable('blobs', function(table) {
    table.dropIndex('fabric_id');
    table.dropIndex('preimage_sha256');
  }).alterTable('documents', function(table) {
    table.dropIndex('fabric_id');
    table.dropIndex('latest_blob_id');
    table.dropIndex('pinned');
    table.dropColumn('pinned');
    table.dropColumn('folders');
  }).alterTable('sources', function(table) {
    table.dropIndex(['status', 'last_retrieved', 'recurrence']);
  }).alterTable('conversations', function(table) {
    table.dropIndex('pinned');
    table.dropColumn('pinned');
    table.dropColumn('context');
  });
}; 