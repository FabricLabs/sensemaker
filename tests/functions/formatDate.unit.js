'use strict';

const assert = require('assert');

const formatDate = require('../../functions/formatDate');

describe('functions/formatDate.js', function () {
  it('exports a function', function () {
    assert.strictEqual(typeof formatDate, 'function');
  });

  it('formats a known date with the correct ordinal suffix', function () {
    assert.strictEqual(formatDate('2026-01-21T12:00:00Z'), 'January 21st, 2026');
    assert.strictEqual(formatDate('2026-01-22T12:00:00Z'), 'January 22nd, 2026');
    assert.strictEqual(formatDate('2026-01-23T12:00:00Z'), 'January 23rd, 2026');
    assert.strictEqual(formatDate('2026-01-24T12:00:00Z'), 'January 24th, 2026');
  });

  it('uses "th" for the teens (11, 12, 13)', function () {
    assert.strictEqual(formatDate('2026-03-11T12:00:00Z'), 'March 11th, 2026');
    assert.strictEqual(formatDate('2026-03-12T12:00:00Z'), 'March 12th, 2026');
    assert.strictEqual(formatDate('2026-03-13T12:00:00Z'), 'March 13th, 2026');
  });

  it('returns "Invalid Date" for unparseable input', function () {
    assert.strictEqual(formatDate('not-a-date'), 'Invalid Date');
  });
});
