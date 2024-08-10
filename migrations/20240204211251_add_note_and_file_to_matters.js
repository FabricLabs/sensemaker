exports.up = function(knex) {
  return knex.schema.alterTable('matters', function(table) {
    table.text('note').nullable();
    table.text('file').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('matters', function(table) {
    table.dropColumn('note');
    table.dropColumn('file');
  });
};
