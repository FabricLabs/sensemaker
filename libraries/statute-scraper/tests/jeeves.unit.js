'use strict';

// Dependencies
const assert = require('assert');
const definition = require('../package');

// Fabric Types
const StatuteProvider = require('../services/StatuteProvider');

// Settings
const SAMPLE_DATA = Buffer.from('DEADBEEF', 'hex'); // TODO: load sample data from Fabric hub
const settings = require('../settings/test');

describe('StatuteProvider', function () {
  this.timeout(60000);

  describe('@statutes/core', function () {
    it('should be instantiable', function () {
      assert.strictEqual(typeof StatuteProvider, 'function');
    });

    it('is instantiable with settings', function () {
      const provider = new StatuteProvider(settings);
      assert.ok(provider);
    });

    it('provides Texas scrapper', async function () {
      const provider = new StatuteProvider(settings);
      assert.ok(provider);
      assert.ok(provider.scrappers);
      assert.ok(provider.scrappers.Texas);
    });

    it('provides Texas constitution', async function () {
      const provider = new StatuteProvider(settings);
      assert.ok(provider);
      assert.ok(provider.scrappers);
      assert.ok(provider.scrappers.Texas);

      const constitution = await provider.scrappers.Texas.constitution();
      console.debug('[TEST:STATUTE-PROVIDER]', 'Constitution:', constitution);
      assert.ok(constitution);
    });
  });
});
