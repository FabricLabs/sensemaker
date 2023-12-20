'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('opinions', function (table) {
    table.string('sha1', 40);
    table.integer('courtlistener_cluster_id');
    table.string('courtlistener_download_url', 500);
    table.string('courtlistener_local_path', 100);
    table.text('plain_text');
    table.text('html');
    table.text('html_lawbox');
    table.text('html_with_citations');
    table.boolean('extracted_by_ocr');
    table.boolean('per_curiam');
    table.integer('page_count');
    table.text('author_str');
    table.text('joined_by_str');
    table.text('xml_harvard');
    table.text('html_anon_2020');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('opinions', function (table) {
    table.dropColumn('sha1');
    table.dropColumn('courtlistener_cluster_id');
    table.dropColumn('courtlistener_download_url');
    table.dropColumn('courtlistener_local_path');
    table.dropColumn('plain_text');
    table.dropColumn('html');
    table.dropColumn('html_lawbox');
    table.dropColumn('html_with_citations');
    table.dropColumn('extracted_by_ocr');
    table.dropColumn('per_curiam');
    table.dropColumn('page_count');
    table.dropColumn('author_str');
    table.dropColumn('joined_by_str');
    table.dropColumn('xml_harvard');
    table.dropColumn('html_anon_2020');
  });
};
