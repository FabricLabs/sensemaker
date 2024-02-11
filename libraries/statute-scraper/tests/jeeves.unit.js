'use strict';

// Package
const definition = require('../package');

// Dependencies
const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

    it('can download the Texas constitution', async function () {
      const provider = new StatuteProvider(settings);
      assert.ok(provider);
      assert.ok(provider.scrappers);
      assert.ok(provider.scrappers.Texas);
      await provider.scrappers.Texas.constitution();
      const file = path.join('.', 'scrapper', 'data', 'states', 'Texas', 'constitution', 'the texas constitution.pdf');
      console.debug('file:', file);
      const exists = fs.existsSync(file);
      assert.ok(exists);
    });
  });
});
