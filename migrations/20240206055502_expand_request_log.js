exports.up = function(knex) {
  return knex.schema.alterTable('requests', function (table) {
    table.text('content').alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('requests', function (table) {
    table.string('content').alter();
  });
};
