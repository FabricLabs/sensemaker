exports.up = function(knex) {
  return knex.schema.table('matters_files', function(table) {
    table.dropColumn('path'); // Drops the 'path' column
  }).then(function() {
    return knex.schema.table('matters_files', function(table) {
      table.integer('file_id').unsigned(); // Adds the 'file_id' column
      table.foreign('file_id').references('id').inTable('files'); // this file_id will be the id from the table files
    });
  });
};

exports.down = function(knex) {
  return knex.schema.table('matters_files', function(table) {
    table.dropColumn('file_id');
  }).then(function() {
    return knex.schema.table('matters_files', function(table) {
      table.text('path');
    });
  });
};
