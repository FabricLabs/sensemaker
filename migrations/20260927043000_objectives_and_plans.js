'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('objectives', (table) => {
    table.increments('id').primary();
    table.string('preimage_sha256', 64).notNullable().unique();
    table.integer('user_id').unsigned().nullable().index();
    table.string('title').notNullable();
    table.text('description');
    table.string('priority').notNullable().defaultTo('medium');
    table.string('status').notNullable().defaultTo('active');
    table.string('target_date').nullable();
    table.string('category').notNullable().defaultTo('general');
    table.text('progress_note').nullable();
    table.timestamp('last_progress_at').nullable();
    table.timestamps(true, true);
  }).createTable('plans', (table) => {
    table.increments('id').primary();
    table.integer('objective_id').unsigned().notNullable().index();
    table.string('preimage_sha256', 64).notNullable();
    table.string('title').notNullable();
    table.string('status').notNullable().defaultTo('active');
    table.text('summary');
    table.timestamp('last_progress_at').nullable();
    table.timestamps(true, true);
  }).createTable('plan_steps', (table) => {
    table.increments('id').primary();
    table.integer('plan_id').unsigned().notNullable().index();
    table.integer('position').notNullable();
    table.string('title').notNullable();
    table.text('detail');
    table.string('status').notNullable().defaultTo('pending');
    table.integer('task_id').unsigned().nullable();
    table.text('evidence').nullable();
    table.timestamp('last_progress_at').nullable();
    table.timestamps(true, true);
  }).alterTable('tasks', (table) => {
    table.text('progress_note').nullable();
    table.timestamp('last_progress_at').nullable();
    table.integer('plan_step_id').unsigned().nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('tasks', (table) => {
    table.dropColumn('progress_note');
    table.dropColumn('last_progress_at');
    table.dropColumn('plan_step_id');
  }).dropTable('plan_steps').dropTable('plans').dropTable('objectives');
};
