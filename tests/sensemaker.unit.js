'use strict';

const assert = require('assert');
const definition = require('../package');
const Sensemaker = require('../types/sensemaker');
const Learner = require('../types/learner');

const SAMPLE_DATA = Buffer.from('DEADBEEF', 'hex');

describe('Sensemaker', function () {
  describe('@sensemaker/core', function () {
    it('should be instantiable', function () {
      assert.strictEqual(typeof Sensemaker, 'function');
    });

    it('should have a correct version attribute', function () {
      const sensemaker = new Sensemaker();
      assert.strictEqual(sensemaker.version, definition.version);
    });

    xit('should implement enable', function () {
      assert.ok(Sensemaker.prototype.enable);
    });

    it('should implement ingest', function () {
      assert.ok(Sensemaker.prototype.ingest);
    });
  });

  describe('@sensemaker/core/types/learner', function () {
    it('should instantiate without error', function () {
      const learner = new Learner();
      assert.ok(learner);
    });

    it('start and stop without error', function (done) {
      async function test () {
        const learner = new Learner();
        await learner.start();
        assert.strictEqual(learner.status, 'STARTED');
        await learner.stop();
        assert.strictEqual(learner.status, 'STOPPED');
        assert.ok(learner);
        done();
      }

      test();
    });

    it('can execute more than 200 ticks per second', function (done) {
      async function test () {
        const learner = new Learner();
        await learner.start();
        assert.strictEqual(learner.status, 'STARTED');
        setTimeout(async function () {
          await learner.stop();
          assert.strictEqual(learner.status, 'STOPPED');
          assert.ok(learner);
          assert.ok(learner.clock > 200);
          done();
        }, 1000);
      }

      test();
    });

    xit('can write and read chunks', function (done) {
      async function test () {
        const learner = new Learner();
        await learner.start();
        assert.strictEqual(learner.status, 'STARTED');

        learner._writeChunk(0xff, SAMPLE_DATA);
        const data = learner._readChunk(0xff);
        assert.strictEqual(data, SAMPLE_DATA);

        setTimeout(async function () {
          await learner.stop();
          assert.strictEqual(learner.status, 'STOPPED');
          assert.ok(learner);
          done();
        }, 1000);
      }

      test();
    });
  });
});
