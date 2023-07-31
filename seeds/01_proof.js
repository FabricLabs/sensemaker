/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  await knex('users').insert([
    { id: 5, username: 'Ryan_Baasch', password: '$2b$10$UgDC5pPhb6WFehZzmxhiN.OPm6B6v4GqlhG2/iCASlK3l2wwxf0NK', salt: '$2b$10$UgDC5pPhb6WFehZzmxhiN.' },
    // Charles
    // 7
    // Jason
    // Nigel
    { id: 10, username: 'Alex_Hoffman', password: '$2b$10$wFp8QrAudeImUcKOu9slRe.BI2Le5s1Q2xpJg8tIMAYdjI5yk1G/W', salt: '$2b$10$wFp8QrAudeImUcKOu9slRe' }
  ]);
};
