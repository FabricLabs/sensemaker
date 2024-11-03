'use strict';

// Dependencies
const assert = require('assert');
const definition = require('../package');
const settings = require('../settings/local');

// Types
const Trainer = require('../types/trainer');

describe('Trainer', function () {
  describe('API', function () {
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

    xit('can be started with the local settings', async function () {
      const trainer = new Trainer(settings);
      await trainer.start();
      assert.strictEqual(trainer instanceof Trainer, true);
      // assert.strictEqual(trainer.status, 'RUNNING');
    });
  });
});
