'use strict';

const fs = require('fs');
const fetch = require('cross-fetch');
const knex = require('knex');

const Sandbox = require('@fabric/http/types/sandbox');

const Worker = require('../types/worker');

const input = require('../settings/local');

async function main (settings) {
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

  const worker = new Worker();

  worker.register('Download', async (...params) => {
    console.debug('DOWNLOAD', 'params:', params);

    /* const sandbox = new Sandbox({
      browser: {
        headless: false
      }
    });

    await sandbox.start();
    await sandbox.download(params[0]);

    const data = await sandbox.export();

    console.log('data:', data); */

    const doc = await fetch(params[0], {
      headers: {
        'Authorization': `Token ${settings.harvard.token}`
      }
    });

    const body = await doc.text();
    fs.writeFileSync(params[1], body);
  });

  worker.start();

  /* worker.addJob({
    type: 'Download',
    params: ['https://fabric.pub', 'assets/fabric.pub']
  }); */

  const unknown = await db('cases').where('pdf_acquired', false).whereNotNull('harvard_case_law_id').orderBy('decision_date', 'asc').first();
  console.debug('got unknown case:', unknown);

  if (unknown && unknown.harvard_case_law_pdf) {
    worker.addJob({
      type: 'Download',
      params: [`https://api.case.law/v1/cases/${unknown.harvard_case_law_id}/?format=pdf&full_case=true`, `stores/cases/${unknown.harvard_case_law_id}.pdf`]
    });
  }

  return {
    target: unknown
  };
}

main(input).catch((exception) => {
  console.error('[DOWNLOADER]', 'Main Process Exception:', exception);
}).then((output) => {
  console.log('[DOWNLOADER]', 'Main Process Result:', output);
});
