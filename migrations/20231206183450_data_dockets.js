/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('dockets', function (table) {
    table.increments('id').unsigned();
    table.datetime('date_created');
    table.string('created_time_zone');
    table.datetime('date_modified');
    table.string('modified_time_zone');
    table.datetime('date_cert_granted');
    table.datetime('date_cert_denied');
    table.datetime('date_argued');
    table.datetime('date_reargued');
    table.datetime('date_reargued_denied');
    table.text('case_name_short');
    table.text('case_name');
    table.text('case_name_full');
    table.string('slug', 75);
    table.string('docket_number');
    table.date('date_blocked');
    table.boolean('blocked');
    table.string('courtlistener_court_id', 15);
    table.integer('assigned_to_id');
    table.string('cause', 2000);
    table.date('date_filed');
    table.date('date_last_filing');
    table.date('date_terminated');
    table.string('courtlistener_filepath_ia', 1000);
    table.string('courtlistener_filepath_local', 1000);
    table.string('courtlistener_jurisdiction_type', 100);
    table.string('jury_demand', 500);
    table.string('nature_of_suit', 1000);
    table.string('pacer_case_id', 100);
    table.integer('referred_to_id');
    table.smallint('source');
    table.text('courtlistener_assigned_to_str')
    table.text('courtlistener_referred_to_string');
    table.text('courtlistener_date_last_index')
    table.text('courtlistener_appeal_from_id', 15);
    table.text('courtlistener_appeal_from_str');
    table.text('appellate_case_type_information');
    table.text('appellate_fee_status');
    table.text('panel_str');
    table.integer('originating_court_information_id');
    table.string('mdl_status', 100);
    table.string('filepath_ia_json', 1000);
    table.datetime('ia_date_first_change');
    table.boolean('ia_needs_upload');
    table.smallint('ia_upload_failure_count');
    table.string('courtlistener_docket_number_core');
    table.integer('idb_data_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('dockets');
};
