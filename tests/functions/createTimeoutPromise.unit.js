'use strict';

const assert = require('assert');

const createTimeoutPromise = require('../../functions/createTimeoutPromise');

describe('functions/createTimeoutPromise.js', function () {
  it('exports a function', function () {
    assert.strictEqual(typeof createTimeoutPromise, 'function');
  });

  it('returns a Promise that rejects after the configured delay', async function () {
    const start = Date.now();
    await assert.rejects(createTimeoutPromise(40), /Fetch timed out/);
    assert.ok(Date.now() - start >= 35, 'should wait at least the configured delay');
  });

  it('rejects with the supplied error message when provided', async function () {
    await assert.rejects(createTimeoutPromise(20, 'custom timeout'), /custom timeout/);
  });

  it('rejects with an Error instance', async function () {
    try {
      await createTimeoutPromise(10);
      assert.fail('should have rejected');
    } catch (err) {
      assert.ok(err instanceof Error);
    }
  });
});
