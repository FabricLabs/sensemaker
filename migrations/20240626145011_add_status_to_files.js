exports.up = function(knex) {
  return knex.schema.table('files', function(table) {
    table.enum('status', ['processing', 'uploaded', 'ingested']).defaultTo('ingested');
  });
};

exports.down = function(knex) {
  return knex.schema.table('files', function(table) {
    table.dropColumn('status');
  });
};
