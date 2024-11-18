'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username').notNullable();
    table.string('password').nullable();
    table.string('salt').nullable();
    table.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
    table.boolean('is_admin').notNullable().defaultTo(false);
    table.boolean('is_compliant').notNullable().defaultTo(false);
    table.boolean('is_beta').defaultTo(false);
    table.string('email');
    table.text('display_name');
    table.string('first_name');
    table.string('last_name');
    table.text('fabric_id');
    table.text('discord_id');
    table.text('discord_token_id');
    table.text('matrix_id');
    table.text('matrix_token_id');
  }).createTable('messages', (table) => {
    table.increments('id').primary();
    table.text('fabric_id', 64);
    table.integer('conversation_id').unsigned();
    table.enu('status', ['ready', 'computing']).defaultTo('ready');
    table.integer('user_id').unsigned().notNullable();
    table.timestamps(true, true); // creates 'created_at' and 'updated_at' columns
    table.string('matrix_event_id');
    table.json('cards');
    table.tinyint('is_read').defaultTo(0).nullable();
    table.enum('help_role', ['user', 'admin']).nullable();
    table.text('discord_id');
    table.text('matrix_id');
    table.text('content', 'text').notNullable();
    table.index(knex.raw('fabric_id(64)'), 'messages_fabric_id_index');
  }).createTable('inquiries', (table) => {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.enum('status', ['waiting', 'invited', 'deleted']).defaultTo('waiting');
    table.string('email').notNullable();
  }).createTable('conversations', (table) => {
    table.increments('id').primary();
    table.string('file_fabric_id', 64);
    table.integer('creator_id').unsigned().notNullable();
    table.timestamps(true, true); // creates 'created_at' and 'updated_at' columns
    table.string('matrix_room_id');
    table.text('discord_id');
    table.text('fabric_id');
    table.text('matrix_id');
    table.string('title');
    table.text('summary');
    table.json('log');
    table.tinyint('help_chat').defaultTo(0).nullable();
  }).createTable('invitations', (table) => {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('sender_id').unsigned();
    table.string('target').notNullable();
    table.enum('status', ['pending', 'accepted', 'declined', 'deleted']).defaultTo('pending');
    table.integer('invitation_count').defaultTo(1);
    table.string('token', 255).nullable();
  }).createTable('requests', (table) => {
    table.increments('id').primary();
    table.text('content');
    table.integer('message_id').unsigned();
    table.timestamps(true, true);
    table.integer('conversation_id').unsigned();
    table.integer('response_id').unsigned();
  }).createTable('responses', (table) => {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.string('actor').notNullable();
    table.string('content').notNullable();
  }).createTable('embeddings', (table) => {
    table.increments('id').primary();
    table.text('fabric_id', 64);
    table.integer('document_id').nullable();
    table.timestamps(true, true);
    table.string('model').notNullable().default('text-embedding-ada-002');
    table.text('text').nullable();
    table.json('content').notNullable();
  }).createTable('reviews', (table) => {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('creator').unsigned().notNullable();
    table.integer('message_id').unsigned().notNullable();
    table.enum('intended_sentiment', ['positive', 'negative']);
    table.string('comment');
    table.integer('rating').unsigned();
  }).createTable('announcements', (table) => {
    table.increments('id').primary();
    table.string('title').nullable();
    table.string('body').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()); // Automatically sets to current date and time
    table.date('expiration_date').nullable(); // Can be null
    table.integer('creator_id').unsigned().notNullable();
  }).createTable('people', function (table) {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.text('fabric_id', 64);
    table.string('full_name');
    table.text('name_first').defaultTo(null);
    table.text('name_middle').defaultTo(null);
    table.text('name_last').defaultTo(null);
    table.text('name_suffix').defaultTo(null);
    table.integer('is_alias_of').defaultTo(null);
    table.text('date_of_birth').defaultTo(null);
    table.text('date_of_death').defaultTo(null);
    table.text('birth_city').defaultTo(null);
    table.text('birth_state').defaultTo(null);
    table.text('death_city').defaultTo(null);
    table.text('death_state').defaultTo(null);
  }).createTable('documents', (table) => {
    table.increments('id').primary();
    table.string('fabric_id', 64);
    table.string('sha1', 40);
    table.string('sha256', 64);
    table.integer('owner').unsigned();
    table.integer('creator').unsigned();
    table.integer('file_size');
    table.timestamps(true, true);
    table.timestamp('date_created');
    table.timestamp('date_modified');
    table.timestamp('date_uploaded');
    table.integer('page_count');
    table.boolean('is_available');
    table.boolean('is_sealed');
    table.text('description');
    table.text('plain_text', 'mediumtext').defaultTo(null);
    table.text('content', 'longtext');
    table.text('html', 'mediumtext');
    table.string('encoding').defaultTo('utf8');
    table.string('title').defaultTo('Untitled Document');
    table.string('filename');
    table.integer('file_id').unsigned();
    table.boolean('deleted').defaultTo(false);
    table.enum('status', ['draft', 'published', 'deleted']);
    table.enum('ingestion_status', ['processing', 'ingested']).defaultTo('ingested');
    table.integer('embedding_id').unsigned();
    table.index('embedding_id');
  }).createTable('password_resets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('token', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()); // Automatically sets to current date and time
    table.index('user_id');
    table.index('token');
  }).createTable('feedback', function (table) {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('creator').unsigned();
    table.integer('conversation_id').unsigned();
    table.text('relates_to');
    table.text('content', 'mediumtext').notNullable();
  }).createTable('files', function (table) {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('creator').unsigned();
    table.text('name').notNullable(); // original file name
    table.text('path').notNullable(); // relative to the storage root
    table.text('type').notNullable(); // mime type
    table.text('relates_to');
    table.boolean('deleted').defaultTo(false);
    table.enum('status', ['processing', 'uploaded', 'ingested']).defaultTo('ingested');
    table.integer('embedding_id').unsigned();
    table.index('embedding_id');
  }).createTable('targets', function (table) {
    table.increments('id').primary();
    table.string('name');
    table.string('description');
    table.string('type').notNullable().defaultTo('hyperlink');
    table.string('link');
    table.string('status').notNullable().defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('creator_id').unsigned().notNullable();
  }).createTable('blobs', function (table) {
    table.increments('id').primary();
    table.string('fabric_id').notNullable();
    table.string('mime_type').notNullable();
    table.longtext('content').notNullable();
    table.timestamps();
  }).createTable('credentials', function (table) {
    table.increments('id').primary();
    table.text('type');
    table.text('content');
    table.text('user_id');
    table.timestamps(true, true);
    table.text('max_age');
    table.text('expires_in');
    table.text('expires_at');
    table.text('refresh_token');
    table.text('scope');
  }).createTable('identities', function (table) {
    table.increments('id').primary();
    table.text('fabric_id');
    table.text('user_id');
    table.text('uid'); // upstream ID
    table.text('type');
    table.text('source');
    table.text('content');
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users')
    .dropTable('messages')
    .dropTable('inquiries')
    .dropTable('conversations')
    .dropTable('invitations')
    .dropTable('requests')
    .dropTable('responses')
    .dropTable('embeddings')
    .dropTable('reviews')
    .dropTable('announcements')
    .dropTable('people')
    .dropTable('documents')
    .dropTable('password_resets')
    .dropTable('feedback')
    .dropTable('files')
    .dropTable('targets')
    .dropTable('blobs')
    .dropTable('credentials')
    .dropTable('identities');
};
