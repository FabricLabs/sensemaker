exports.up = function (knex) {
  return knex.schema.alterTable('conversations', function(table) {
    table.string('matrix_room_id')
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('conversations', function(table) {
    table.dropColumn('matrix_room_id');
  });
};
