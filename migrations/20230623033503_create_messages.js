exports.up = function (knex) {
  return knex.schema.createTable('messages', (table) => {
    table.increments('id').primary();
    table.string('content').notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('users.id');
    table.timestamps(true, true); // creates 'created_at' and 'updated_at' columns
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('messages');
};
