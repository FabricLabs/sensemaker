exports.up = function(knex) {
  return knex.schema.alterTable('documents', function(table) {
    table.boolean('deleted').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('documents', function(table) {
    table.dropColumn('deleted');
  });
};