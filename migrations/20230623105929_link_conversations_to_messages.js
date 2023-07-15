exports.up = function (knex) {
  return knex.schema.alterTable('messages', function (table) {
    table.integer('conversation_id').unsigned().references('id').inTable('conversations');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('conversations');
};
