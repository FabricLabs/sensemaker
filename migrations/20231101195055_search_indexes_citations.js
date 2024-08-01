exports.up = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.index(knex.raw('title(512)'), 'cases_title_index');
    table.index('short_name');
    table.index('decision_date');
    table.index('harvard_case_law_id');
  }).createTable('citations', (table) => {
    table.integer('case_id').unsigned().references('cases.id');
    table.integer('target_id').unsigned().references('cases.id');
  }).alterTable('embeddings', (table) => {
    table.text('text', 'text').notNullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cases', function (table) {
    table.dropIndex('', 'cases_title_index');
    table.dropIndex('short_name');
    table.dropIndex('decision_date');
    table.dropIndex('harvard_case_law_id');
  }).dropTable('citations').alterTable('embeddings', (table) => {
    table.string('text').notNullable();
  });
};
