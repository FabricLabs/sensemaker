'use strict';

exports.up = function(knex) {
  return knex.raw('ALTER TABLE cases ADD INDEX cases_pacer_case_id_index (pacer_case_id(100))');
};

exports.down = function(knex) {
  return knex.raw('ALTER TABLE cases DROP INDEX cases_pacer_case_id_index');
};
