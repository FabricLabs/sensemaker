'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.text('pacer_case_id', 100);
    table.date('date_filed');
    table.date('date_argued');
    table.date('date_reargued');
    table.date('date_reargument_denied');
    table.date('date_blocked');
    table.date('date_last_filing');
    table.date('date_terminated');
    table.text('cause', 2000);
    table.text('nature_of_suit', 1000);
    table.text('jury_demand', 500);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.dropColumn('pacer_case_id');
    table.dropColumn('date_filed');
    table.dropColumn('date_argued');
    table.dropColumn('date_reargued');
    table.dropColumn('date_reargument_denied');
    table.dropColumn('date_blocked');
    table.dropColumn('date_last_filing');
    table.dropColumn('date_terminated');
    table.dropColumn('cause');
    table.dropColumn('nature_of_suit');
    table.dropColumn('jury_demand');
  });
};
