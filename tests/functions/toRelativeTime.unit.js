'use strict';

// Dependencies
const assert = require('assert');
const definition = require('../package');
const settings = require('../settings/local');

// Functions
const toRelativeTime = require('../functions/toRelativeTime');

describe('functions/toRelativeTime.js', function () {
  describe('toRelativeTime', function () {
    it('should be instantiable', function () {
      assert.strictEqual(typeof toRelativeTime, 'function');
    });
  });
});
