'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.string('fabric_type');
    table.string('summary');
  }).alterTable('files', function (table) {
    table.string('preimage_sha256');
  }).alterTable('invitations', function (table) {
    table.string('fabric_id');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('documents', function (table) {
    table.dropColumn('summary');
    table.dropColumn('fabric_type');
  }).alterTable('files', function (table) {
    table.dropColumn('preimage_sha256');
  }).alterTable('invitations', function (table) {
    table.dropColumn('fabric_id');
  });
};
