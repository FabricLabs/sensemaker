exports.up = function (knex) {
  return knex.schema.createTable('requests', (table) => {
    table.increments('id').primary();
    table.string('content');
    table.integer('message_id').unsigned().references('id').inTable('messages');
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('requests');
};
