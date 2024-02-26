exports.up = function(knex) {
  return knex.schema.createTable('matters_files', function(table) {
    table.increments('id').primary();
    table.text('filename');
    table.integer('matter_id').unsigned().references('matters.id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.boolean('deleted').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('matters_files');
};
