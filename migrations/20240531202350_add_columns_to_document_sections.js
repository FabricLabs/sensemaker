exports.up = function(knex) {
  return knex.schema.table('document_sections', function(table) {
    table.string('fabric_id', 64);
    table.integer('creator').unsigned().nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('document_sections', function(table) {
    table.dropColumn('fabric_id');
    table.dropColumn('creator');
  });
};
