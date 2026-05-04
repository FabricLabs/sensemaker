'use strict';

// Dependencies
const assert = require('assert');
const definition = require('../../package');
const settings = require('../../settings/local');

// Functions
const toRelativeTime = require('../../functions/toRelativeTime');

describe('functions/toRelativeTime.js', function () {
  describe('toRelativeTime', function () {
    it('should be a function', function () {
      assert.strictEqual(typeof toRelativeTime, 'function');
    });

    it('returns "just now" for the current moment', function () {
      assert.strictEqual(toRelativeTime(new Date()), 'just now');
    });

    it('returns seconds for sub-minute deltas', function () {
      const past = new Date(Date.now() - 5_000);
      assert.match(toRelativeTime(past), /^[1-9]\d? seconds? ago$/);
    });

    it('returns minutes for sub-hour deltas', function () {
      const past = new Date(Date.now() - 5 * 60_000);
      assert.match(toRelativeTime(past), /^[1-5] minutes? ago$/);
    });

    it('returns hours for sub-day deltas', function () {
      const past = new Date(Date.now() - 3 * 60 * 60_000);
      assert.match(toRelativeTime(past), /^[1-3] hours? ago$/);
    });

    it('returns days for sub-week deltas', function () {
      const past = new Date(Date.now() - 3 * 24 * 60 * 60_000);
      assert.match(toRelativeTime(past), /^[1-3] days? ago$/);
    });

    it('uses singular form for 1', function () {
      const past = new Date(Date.now() - 60_000);
      assert.strictEqual(toRelativeTime(past), '1 minute ago');
    });

    it('accepts ISO date strings', function () {
      const iso = new Date(Date.now() - 2 * 60_000).toISOString();
      assert.match(toRelativeTime(iso), /^[12] minutes? ago$/);
    });
  });
});
