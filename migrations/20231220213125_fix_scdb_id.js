exports.up = function (knex) {
  return knex.schema.alterTable('opinions', function (table) {
    table.string('scdb_id', 10).alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('opinions', function (table) {
    table.integer('scdb_id').alert();
  });
};
