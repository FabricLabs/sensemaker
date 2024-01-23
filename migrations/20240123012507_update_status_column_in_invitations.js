exports.up = function(knex) {
  return knex.schema.table('invitations', function(table) {
    // Modify 'status' column to include 'deleted'
    table.enum('status', ['pending', 'accepted', 'declined', 'deleted']).defaultTo('pending').alter();
  });
};

exports.down = function(knex) {
  return knex.schema.table('invitations', function(table) {
    // Rollback to original 'status' column values
    table.enum('status', ['pending', 'accepted', 'declined']).defaultTo('pending').alter();
  });
};
