'use strict';

// Package Definition
const definition = require('../package');

// Dependencies
const assert = require('assert');
const Sensemaker = require('../services/sensemaker');
const Learner = require('../types/learner');

const settings = require('../settings/local');

describe('Sensemaker', function () {
  this.timeout(60000);

  describe('@sensemaker/core', function () {
    it('should be instantiable', function () {
      assert.strictEqual(typeof Sensemaker, 'function');
    });

    it('should have a correct version attribute', function () {
      const sensemaker = new Sensemaker();
      assert.strictEqual(sensemaker.version, definition.version);
    });

    it('exposes start and stop lifecycle methods', function () {
      assert.strictEqual(typeof Sensemaker.prototype.start, 'function');
      assert.strictEqual(typeof Sensemaker.prototype.stop, 'function');
    });

    it('exposes the request handler used by chat routes', function () {
      assert.strictEqual(typeof Sensemaker.prototype._handleRequest, 'function');
    });

    it('can be instantiated with local settings for integration wiring', function () {
      const sensemaker = new Sensemaker(settings);
      assert.ok(sensemaker);
      assert.strictEqual(sensemaker.version, definition.version);
    });
  });

  describe('@sensemaker/core/types/learner', function () {
    it('should instantiate without error', function () {
      const learner = new Learner();
      assert.ok(learner);
    });
  });
});

