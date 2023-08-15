/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  await knex('users').insert([
    { id: 5, username: 'Ryan_Baasch', password: '$2b$10$UgDC5pPhb6WFehZzmxhiN.OPm6B6v4GqlhG2/iCASlK3l2wwxf0NK', salt: '$2b$10$UgDC5pPhb6WFehZzmxhiN.' },
    { id: 6, username: 'Charles_Porges', password: '$2b$10$bC3.LdyZ3vwspSS9xJ2BTeueAm.7cyzEBGWmO7mmoUYe1IvKdVqzS', salt: '$2b$10$bC3.LdyZ3vwspSS9xJ2BTe' },
    // 7
    // Jason
    { id: 9, username: 'Nigel_Kostic', password: '$2b$10$PBwwnDy83EPZvFwokUhLEOwXF9D9tlTn1j3wXY26rIa1DTWZZAVPK', salt: '$2b$10$PBwwnDy83EPZvFwokUhLEO' },
    { id: 10, username: 'Alex_Hoffman', password: '$2b$10$wFp8QrAudeImUcKOu9slRe.BI2Le5s1Q2xpJg8tIMAYdjI5yk1G/W', salt: '$2b$10$wFp8QrAudeImUcKOu9slRe' }
  ]);
};
