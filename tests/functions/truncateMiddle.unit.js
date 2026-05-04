'use strict';

const assert = require('assert');

const truncateMiddle = require('../../functions/truncateMiddle');

describe('functions/truncateMiddle.js', function () {
  it('exports a function', function () {
    assert.strictEqual(typeof truncateMiddle, 'function');
  });

  it('returns the input unchanged when shorter than the limit', function () {
    assert.strictEqual(truncateMiddle('abc', 10), 'abc');
  });

  it('returns the input unchanged when equal to the limit', function () {
    assert.strictEqual(truncateMiddle('abcdefghij', 10), 'abcdefghij');
  });

  it('truncates the middle with the default separator', function () {
    const out = truncateMiddle('abcdefghijklmno', 7);
    assert.ok(out.includes('…'));
    assert.ok(out.length <= 7);
    assert.ok(out.startsWith('a'));
    assert.ok(out.endsWith('o'));
  });

  it('honors a custom separator', function () {
    const out = truncateMiddle('abcdefghijklmno', 9, '...');
    assert.ok(out.includes('...'));
    assert.ok(out.startsWith('abc'));
    assert.ok(out.endsWith('mno'));
  });
});
