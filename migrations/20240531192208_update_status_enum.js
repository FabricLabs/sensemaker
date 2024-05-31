exports.up = function(knex) {
  return knex.schema.table('documents', function(table) {
    // Alter the status column to include 'deleted' as an option
    table.enum('status', ['draft', 'published', 'deleted'])
          .alter();
  });
};

exports.down = function(knex) {
  return knex.schema.table('documents', function(table) {
    table.enum('status', ['draft', 'published'])
          .alter();
  });
};
