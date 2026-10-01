'use strict';

const assert = require('assert');

const toMySQLDatetime = require('../../functions/toMySQLDatetime');

describe('functions/toMySQLDatetime.js', function () {
  it('exports a function', function () {
    assert.strictEqual(typeof toMySQLDatetime, 'function');
  });

  it('returns YYYY-MM-DD HH:MM:SS for a known UTC date', function () {
    const date = new Date('2026-01-15T12:34:56.789Z');
    assert.strictEqual(toMySQLDatetime(date), '2026-01-15 12:34:56');
  });

  it('drops milliseconds and the T separator', function () {
    const date = new Date('2026-04-30T08:00:00.500Z');
    const out = toMySQLDatetime(date);
    assert.ok(!out.includes('T'));
    assert.ok(!out.includes('.'));
    assert.match(out, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('defaults to the current time when no argument is supplied', function () {
    const out = toMySQLDatetime();
    assert.match(out, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
