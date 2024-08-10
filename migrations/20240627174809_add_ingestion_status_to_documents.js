exports.up = function(knex) {
  return knex.schema.table('documents', function(table) {
    table.enum('ingestion_status', ['processing', 'ingested']).defaultTo('ingested');
  });
};

exports.down = function(knex) {
  return knex.schema.table('documents', function(table) {
    table.dropColumn('ingestion_status');
  });
};
