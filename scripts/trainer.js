'use strict';

const settings = require('../settings/local');
const Trainer = require('../types/trainer');

async function main (input = {}) {
  const trainer = new Trainer(input);
  await trainer.start();

  await trainer.ingestDocument({ content: 'My name is Eric.' });
  const answer = await trainer.query({ query: 'What is my name?' });

  console.debug('[TRAINER]', '[MAIN]', 'answer:', answer);

  const search = await trainer.search({ query: 'novo' });
  console.debug('[TRAINER]', '[MAIN]', 'search:', search) ;

  return { id: trainer.id };
}

main(settings).catch((exception) => {
  console.error('[TRAINER]', '[EXCEPTION]', exception);
}).then((output) => {
  console.log('[TRAINER]', '[OUTPUT]', output);
});
