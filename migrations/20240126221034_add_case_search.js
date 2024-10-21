'use strict';

exports.up = function (knex) {
  return knex.schema.raw('ALTER TABLE cases ADD FULLTEXT INDEX cases_fulltext_index (title, summary)');
};

exports.down = function (knex) {
  return knex.schema.raw('ALTER TABLE cases DROP INDEX cases_fulltext_index');
};
