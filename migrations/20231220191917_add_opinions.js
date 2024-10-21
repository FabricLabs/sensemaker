'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('opinions', (table) => {
    table.increments('id').primary();
    table.timestamp('date_created');
    table.timestamp('date_modified');
    table.integer('courtlistener_id');
    table.integer('citation_count');
    table.text('judges');
    table.date('date_filed');
    table.string('scdb_id', 10);
    table.integer('scdb_decision_direction');
    table.integer('scdb_votes_majority');
    table.integer('scdb_votes_minority');
    table.text('case_name');
    table.text('case_name_short');
    table.text('case_name_full');
    table.string('source', 10);
    table.text('procedural_history');
    table.text('attorneys');
    table.text('nature_of_suit');
    table.text('posture');
    table.text('syllabus');
    table.string('precedential_status', 50);
    table.date('date_blocked');
    table.boolean('blocked');
    table.integer('courtlistener_docket_id');
    table.boolean('date_filed_is_approximate');
    table.text('correction');
    table.text('cross_reference');
    table.text('disposition');
    table.string('filepath_json_harvard', 1000);
    table.text('headnotes');
    table.text('history');
    table.text('other_dates');
    table.text('summary');
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('opinions');
};
