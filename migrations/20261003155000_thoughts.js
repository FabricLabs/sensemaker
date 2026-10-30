'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('thoughts', (table) => {
    table.increments('id').primary();
    table.integer('owner').unsigned().nullable().index();
    table.string('subject_type', 32).notNullable().index();
    table.string('subject_id', 128).nullable().index();
    table.integer('task_id').unsigned().nullable().index();
    table.integer('step_id').unsigned().nullable().index();
    table.integer('objective_id').unsigned().nullable().index();
    table.integer('conversation_id').unsigned().nullable().index();
    table.string('agent_name', 64).nullable().index();
    table.string('kind', 40).nullable();
    table.integer('seq').unsigned().notNullable();
    table.string('local_key', 64).notNullable();
    table.string('from_actor', 64).notNullable();
    table.string('to_actor', 64).notNullable();
    table.string('role', 16).notNullable();
    table.text('content');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('thoughts');
};
