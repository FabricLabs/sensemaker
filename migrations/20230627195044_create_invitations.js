exports.up = function (knex) {
  return knex.schema.createTable('invitations', (table) => {
    table.increments('id').primary();
    table.integer('sender_id').unsigned().references('users.id');
    table.string('target').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('invitations');
};
