exports.up = function(knex) {
  return knex.schema.createTable('conversations', (table) => {
    table.increments('id').primary();
    table.string('title');
    table.json('log');
    table.integer('creator_id').unsigned().notNullable();
    table.foreign('creator_id').references('users.id');
    table.timestamps(true, true); // creates 'created_at' and 'updated_at' columns
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('conversations');
};
