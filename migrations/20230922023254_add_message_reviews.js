'use strict';

exports.up = function (knex) {
  return knex.schema.createTable('reviews', (table) => {
    table.increments('id').primary();
    table.timestamps(true, true);
    table.integer('creator').unsigned().notNullable();
    table.foreign('creator').references('users.id');
    table.integer('message_id').unsigned().notNullable();
    table.foreign('message_id').references('messages.id');
    table.enum('intended_sentiment', ['positive', 'negative']);
    table.string('comment');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('reviews');
};
