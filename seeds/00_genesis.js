/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('requests').del();
  await knex('messages').del();
  await knex('conversations').del();
  await knex('users').del();
  await knex('users').insert([
    { id: 1, username: 'JeevesAI', email: 'jeeves@jeeves.dev' },
    { id: 2, username: 'Administrator', email: 'admin@jeeves.dev', is_admin: true },
    { id: 3, username: 'martindale', email: 'eric@jeeves.dev', is_admin: true, password: '$2b$10$p39AvbqtRbCyhfwtj5z78eE8TFafZVVW1s5SoEegIlCBIyoGGlIUW', salt: '$2b$10$p39AvbqtRbCyhfwtj5z78e' },
    { id: 4, username: 'Wry', email: 'johnny@jeeves.dev', password: '$2b$10$TICJ5X5S11W.JTTEtS26ZOzewbGGZi3aYyfXajpNxiXoT.R9FBmxq', salt: '$2b$10$TICJ5X5S11W.JTTEtS26ZO' }
  ]);
};
