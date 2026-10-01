'use strict';

const GitHub = require('@fabric/github');

async function compute (input = {}) {
  const github = new GitHub();
  await github.start();

  return `## Commit Report: ${JSON.stringify(github.export(), null, '  ')}`;
}

module.exports = compute;
