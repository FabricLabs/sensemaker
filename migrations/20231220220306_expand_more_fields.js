'use strict';

exports.up = function (knex) {
  return knex.schema.alterTable('opinions', function (table) {
    table.mediumtext('plain_text').alter();
    table.mediumtext('html').alter();
    table.mediumtext('html_lawbox').alter();
    table.mediumtext('xml_harvard').alter();
    table.mediumtext('html_anon_2020').alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('opinions', function (table) {
    table.text('plain_text').alter();
    table.text('html').alter();
    table.text('html_lawbox').alter();
    table.text('xml_harvard').alter();
    table.text('html_anon_2020').alter();
  });
};
