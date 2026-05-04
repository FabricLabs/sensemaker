'use strict';

const assert = require('assert');

const formatBitcoin = require('../../functions/formatBitcoin');

describe('functions/formatBitcoin.js', function () {
  it('exports a function', function () {
    assert.strictEqual(typeof formatBitcoin, 'function');
  });

  it('formats whole numbers with at least two decimal places', function () {
    assert.strictEqual(formatBitcoin(1), '1.00');
  });

  it('preserves significant decimals up to 8 places', function () {
    assert.strictEqual(formatBitcoin(0.123), '0.123');
    assert.strictEqual(formatBitcoin(0.00000001), '0.00000001');
  });

  it('inserts thousands separators in the integer part', function () {
    assert.strictEqual(formatBitcoin(1000), '1,000.00');
    assert.strictEqual(formatBitcoin(1234567), '1,234,567.00');
  });

  it('coerces strings to numbers', function () {
    assert.strictEqual(formatBitcoin('21.5'), '21.50');
  });

  it('treats invalid input as zero', function () {
    assert.strictEqual(formatBitcoin('not a number'), '0.00');
    assert.strictEqual(formatBitcoin(undefined), '0.00');
    assert.strictEqual(formatBitcoin(null), '0.00');
  });
});
