'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.string('decision_date', 64);
    table.string('short_name');
    table.string('harvard_case_law_pdf');
    table.string('harvard_case_law_court_name');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.dropColumn('decision_date');
    table.dropColumn('short_name');
    table.dropColumn('harvard_case_law_pdf');
    table.dropColumn('harvard_case_law_court_name');
  });
};
