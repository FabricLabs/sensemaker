'use strict';

// Dependencies
const assert = require('assert');

// Functions
const IngestFile = require('../functions/IngestFile');

describe('IngestFile', function () {
  describe('constructor', function () {
    it('should be instantiable', function () {
      assert.strictEqual(typeof IngestFile, 'function');
    });
  });
});
