exports.up = function(knex) {
    return knex.schema.table('invitations', function(table) {
      table.string('token', 255).nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('invitations', function(table) {
      table.dropColumn('token');
    });
  };
  