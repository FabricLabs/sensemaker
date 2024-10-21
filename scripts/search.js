'use strict';

const fetch = require('cross-fetch');

async function main () {
  const results = await fetch('http://localhost:3045', {
    method: 'SEARCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'martindale'
    })
  });

  try {
    const object = await results.json();
    console.debug('Object:', object);
  } catch (exception) {
    console.error('Exception:', exception);
  }
}

main().then((result) => {
  console.log('Result:', result);
}).catch((exception) => {
  console.error('Exception:', exception);
});
