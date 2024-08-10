exports.up = function (knex) {
  return knex.schema.createTable('inquiries', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('inquiries');
};
