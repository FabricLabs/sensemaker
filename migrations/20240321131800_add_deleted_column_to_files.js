exports.up = function(knex) {
  return knex.schema.alterTable('files', function(table) {
    table.boolean('deleted').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('files', function(table) {
    table.dropColumn('deleted');
  });
};
