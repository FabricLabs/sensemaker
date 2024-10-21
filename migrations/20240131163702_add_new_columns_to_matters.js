exports.up = function(knex) {
  return knex.schema.alterTable('matters', function(table) {
    table.text('plaintiff');
    table.text('defendant');
    table.enum('representing', ['P', 'D']).nullable();
    table.integer('jurisdiction_id').unsigned().nullable()
          .references('id').inTable('jurisdictions');
    table.integer('court_id').unsigned().nullable()
          .references('id').inTable('courts');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('matters', function(table) {
    table.dropColumn('plaintiff');
    table.dropColumn('defendant');
    table.dropColumn('representing');
    table.dropColumn('jurisdiction_id');
    table.dropColumn('court_id');
  });
};
