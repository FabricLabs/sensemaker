'use strict';

// Settings
const settings = require('../settings/local');
const input = Object.assign({
  authority: 'jeeves.dev'
}, settings);

// Dependencies
const knex = require('knex');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Internal Types
const Scraper = require('../types/scraper');

// Main Process
async function main (settings = {}) {
  const scraper = new Scraper(settings);
  const db = knex({
    client: 'mysql2',
    connection: {
      host: settings.db.host,
      port: settings.db.port,
      user: settings.db.user,
      password: settings.db.password,
      database: settings.db.database
    }
  });

  scraper.on('case', function (item) {
    const tableName = 'cases';
    const actor = new Actor({ name: `harvard/cases/${item.content.id}` });
    const data = {
      fabric_id: actor.id,
      harvard_case_law_id: item.content.id,
      harvard_case_law_pdf: item.content.frontend_pdf_url,
      harvard_case_law_court_name: item.content.court.name,
      title: item.content.name,
      short_name: item.content.name_abbreviation,
      decision_date: item.content.decision_date
    };

    const columns = Object.keys(data);
    const values = Object.values(data);
    const columnPlaceholders = columns.map(() => '??').join(', ');
    const valuePlaceholders = values.map(() => '?').join(', ');
    const updateStatements = columns.map(column => `${column} = VALUES(${column})`).join(', ');
    const query = `INSERT INTO ?? (${columnPlaceholders}) VALUES (${valuePlaceholders}) ON DUPLICATE KEY UPDATE ${updateStatements}`;

    db.raw(query, [tableName, ...columns, ...values]).then((set) => {
      const result = set[0];
      if (result.insertId) console.debug('Created local case:', actor.id, (result.insertId) ? `novo/cases/${result.insertId}` : undefined);
    }).catch(error => {
      console.error('Could not create local case:', error);
    });
  });

  await scraper.start();

  return {
    // id: this.id,
    scraper: scraper
  };
}

main(input).then((output) => {
  console.log('[JEEVES:SCRAPER]', output);
});
