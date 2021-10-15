'use strict';

const assert = require('assert');
const definition = require('../package');
const Sensemaker = require('../types/sensemaker');

describe('Sensemaker', function () {
  it('should be instantiable', function () {
    assert.strictEqual(typeof Sensemaker, 'function');
  });

  it('should have a correct version attribute', function () {
    let sensemaker = new Sensemaker();
    assert.strictEqual(sensemaker.version, definition.version);
  });

  xit('should implement enable', function () {
    assert.ok(Sensemaker.prototype.enable);
  });

  it('should implement ingest', function () {
    assert.ok(Sensemaker.prototype.ingest);
  });
});
