exports.up = function(knex) {
  return knex.schema.table('inquiries', function(table) {
    table.enum('status', ['waiting', 'invited', 'deleted']).defaultTo('waiting');
  });
};

exports.down = function(knex) {
  return knex.schema.table('inquiries', function(table) {
    table.dropColumn('status');
  });
};
