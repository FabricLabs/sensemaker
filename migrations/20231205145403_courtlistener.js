
exports.up = function(knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.integer('courtlistener_id').unsigned();
    table.integer('duplicate_of').unsigned();
  }).createTable('people', function (table) {
    table.increments('id').primary();
    table.string('full_name');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.dropColumn('courtlistener_id');
    table.dropColumn('duplicate_of');
  }).dropTable('people');
};
