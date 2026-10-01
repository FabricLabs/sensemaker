'use strict';

// Dependencies
const assert = require('assert');
const definition = require('../package');
const settings = require('../settings/local');

// Types
const Trainer = require('../types/trainer');

describe('Trainer', function () {
  describe('API', function () {
    this.timeout(10000);

    it('should be instantiable', function () {
      assert.strictEqual(typeof Trainer, 'function');
    });

    it('can be instantiated without a configuration', function () {
      const trainer = new Trainer();
      assert.strictEqual(trainer instanceof Trainer, true);
    });

    it('can be instantiated with the local settings', function () {
      const trainer = new Trainer(settings);
      assert.strictEqual(trainer instanceof Trainer, true);
    });

    it('exposes async lifecycle methods for integration startup', function () {
      const trainer = new Trainer(settings);
      assert.strictEqual(typeof trainer.start, 'function');
      assert.strictEqual(typeof trainer.stop, 'function');
      assert.strictEqual(trainer.start.constructor.name, 'Function');
    });
  });
});
