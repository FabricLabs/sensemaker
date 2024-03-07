exports.up = function(knex) {
  return knex.schema.table('matters_files', function(table) {
    table.text('path').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('matters_files', function(table) {
    table.dropColumn('path');
  });
};
