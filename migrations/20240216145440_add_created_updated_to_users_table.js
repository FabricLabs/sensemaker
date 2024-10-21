exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.timestamp('created_at').nullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
  });
};
