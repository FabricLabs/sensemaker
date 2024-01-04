'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('embeddings', function (table) {
    table.text('fabric_id', 64);
  }).alterTable('cases', function (table) {
    table.integer('title_embedding_id').unsigned();
    table.integer('body_embedding_id').unsigned();
  })
  .then(() => knex.raw('ALTER TABLE cases ADD INDEX cases_fabric_id_index (fabric_id(64))'))
  // .then(() => knex.raw('ALTER TABLE embeddings ADD INDEX embeddings_fabric_id_index (fabric_id(64))'));
};

exports.down = function (knex) {
  return knex.schema.alterTable('embeddings', function (table) {
    table.dropColumn('fabric_id');
  }).alterTable('cases', function (table) {
    table.dropColumn('title_embedding_id');
    table.dropColumn('body_embedding_id');
    table.dropIndex('fabric_id');
  });
};
