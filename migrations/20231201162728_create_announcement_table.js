exports.up = function (knex) {
    return knex.schema.createTable('announcements', (table) => {
      table.increments('id').primary();
      table.string('title').nullable();
      table.string('body').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()); // Automatically sets to current date and time
      table.date('expiration_date').nullable(); // Can be null
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('announcements');
  };