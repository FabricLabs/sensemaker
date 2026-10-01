'use strict';

const assert = require('assert');

const createPasswordResetEmailContent = require('../../functions/createPasswordResetEmailContent');

describe('functions/createPasswordResetEmailContent.js', function () {
  it('exports a function', function () {
    assert.strictEqual(typeof createPasswordResetEmailContent, 'function');
  });

  it('returns an HTML string containing the reset link', function () {
    const reset = 'https://sensemaker.io/password-reset?token=abc';
    const html = createPasswordResetEmailContent(reset);

    assert.strictEqual(typeof html, 'string');
    assert.ok(html.includes('<html>'));
    assert.ok(html.includes(reset));
    assert.ok(html.includes('Reset Password'));
    assert.ok(html.includes('Password Reset Request'));
  });
});
