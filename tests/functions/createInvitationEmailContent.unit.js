'use strict';

const assert = require('assert');

const createInvitationEmailContent = require('../../functions/createInvitationEmailContent');

describe('functions/createInvitationEmailContent.js', function () {
  it('exports a function', function () {
    assert.strictEqual(typeof createInvitationEmailContent, 'function');
  });

  it('returns an HTML string containing both links', function () {
    const accept = 'https://sensemaker.io/accept?token=abc';
    const decline = 'https://sensemaker.io/decline?token=abc';
    const html = createInvitationEmailContent(accept, decline);

    assert.strictEqual(typeof html, 'string');
    assert.ok(html.includes('<html>'));
    assert.ok(html.includes(accept));
    assert.ok(html.includes(decline));
    assert.ok(html.includes('Join Sensemaker'));
  });
});
