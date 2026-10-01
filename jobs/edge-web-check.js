'use strict';

const HTTPClient = require('@fabric/http/types/client');

async function main (input = {}) {
  if (!input.targets) input.targets = [];

  const targets = {};

  for (const target in input.targets) {
    const client = new HTTPClient({
      remote: target
    });

    targets[target] = client;
  }

  return `## Commit Report: ${JSON.stringify(github.export(), null, '  ')}`;
}

module.exports = main;
