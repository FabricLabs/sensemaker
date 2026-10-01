'use strict';

// Dependencies
const assert = require('assert');

// Functions
const IngestFile = require('../../functions/IngestFile');

describe('IngestFile', function () {
  describe('module shape', function () {
    it('exports a function', function () {
      assert.strictEqual(typeof IngestFile, 'function');
    });

    it('is awaitable (returns a Promise)', async function () {
      const ctx = {
        db: () => ({
          where: () => ({
            first: async () => null,
            update: async () => 1
          })
        })
      };
      const result = IngestFile.call(ctx, 'missing-id');
      assert.ok(result && typeof result.then === 'function', 'expected a thenable');
      await assert.rejects(result, /File with ID missing-id not found/);
    });

    it('rejects when no file id is found in the database', async function () {
      const ctx = {
        db: () => ({
          where: () => ({
            first: async () => null,
            update: async () => 1
          })
        })
      };

      await assert.rejects(
        IngestFile.call(ctx, 'missing-id'),
        /File with ID missing-id not found/
      );
    });
  });
});
