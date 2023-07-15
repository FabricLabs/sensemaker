exports.up = function (knex) {
  return knex.schema.alterTable('messages', function(table) {
    table.string('matrix_event_id')
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('messages', function(table) {
    table.dropColumn('matrix_event_id');
  });
};
