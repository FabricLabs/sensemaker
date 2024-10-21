'use strict';

const settings = require('../settings/local');
const Email = require('../services/email');

async function main (settings = {}) {
  const email = new Email(settings);
  email.send({
    from: 'agent@trynovo.com',
    to: 'eric@ericmartindale.com',
    subject: 'Test Message',
    text: 'This is a test message.'
  })
}

main(settings.email).catch((exception) => {
  console.error('Exception:', exception);
}).then((output) => {
  console.log('Result:', output);
});
