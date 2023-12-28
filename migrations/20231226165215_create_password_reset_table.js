exports.up = function (knex) {
    return knex.schema.createTable('password_resets', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id').references('users.id');
      table.string('token', 255).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()); // Automatically sets to current date and time

      table.index('user_id');
      table.index('token');
      
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('password_resets');
  };
  