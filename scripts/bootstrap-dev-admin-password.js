#!/usr/bin/env node
'use strict';

/**
 * Sets a bcrypt password on the seeded admin user (`Administrator` / `root@localhost`)
 * so you can log in and send invitation emails (captured by Mailpit).
 *
 *   SENSEMAKER_DEV_ADMIN_PASSWORD=your-secret node scripts/bootstrap-dev-admin-password.js
 *
 * Default password if env unset: `changeme` (development only).
 */

const { hashSync, genSaltSync } = require('bcrypt');
const knex = require('knex')(require('../knexfile').development);

const password = process.env.SENSEMAKER_DEV_ADMIN_PASSWORD || 'changeme';

async function main () {
  const admin = await knex('users').where({ is_admin: 1 }).orWhere({ username: 'Administrator' }).first();
  if (!admin) {
    console.error('[bootstrap-dev-admin] No admin user found. Run: npm run setup:seed');
    process.exitCode = 1;
    return;
  }
  const salt = genSaltSync(10);
  const hashed = hashSync(password, salt);
  await knex('users').where({ id: admin.id }).update({
    password: hashed,
    salt,
    updated_at: knex.fn.now()
  });
  console.log(`[bootstrap-dev-admin] Updated user id=${admin.id} (${admin.username}). Password from SENSEMAKER_DEV_ADMIN_PASSWORD or default "changeme".`);
}

main()
  .catch((err) => {
    console.error('[bootstrap-dev-admin]', err.message);
    process.exitCode = 1;
  })
  .finally(() => knex.destroy());
