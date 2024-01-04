'use strict';

// Dependencies
const assert = require('assert');
const definition = require('../package');

// Fabric Types
const Jeeves = require('../services/jeeves');
const Learner = require('../types/learner');

// Settings
const SAMPLE_DATA = Buffer.from('DEADBEEF', 'hex');
const settings = require('../settings/local');

// GPT4
const { getEncoding, encodingForModel } = require('js-tiktoken');

describe('Jeeves', function () {
  this.timeout(30000);

  describe('@jeeves/core', function () {
    it('should be instantiable', function () {
      assert.strictEqual(typeof Jeeves, 'function');
    });

    xit('should implement the GPT4 encoder', function () {
      const enc = getEncoding('gpt4');
      assert.strictEqual(typeof enc, 'object');
    });

    xit('should implement the GPT3.5 encoder', function () {
      const enc = getEncoding('gpt3.5');
      assert.strictEqual(typeof enc, 'object');
    });

    xit('should implement the GPT3 encoder', function () {
      const enc = getEncoding('gpt3');
      assert.strictEqual(typeof enc, 'object');
    });

    it('should implement the GPT2 encoder', function () {
      const enc = getEncoding('gpt2');
      assert.strictEqual(typeof enc, 'object');
    });

    xit('should have a correct version attribute', function () {
      const jeeves = new Jeeves();
      assert.strictEqual(jeeves.version, definition.version);
    });

    xit('should implement enable', function () {
      assert.ok(Jeeves.prototype.enable);
    });

    it('should implement ingest', function () {
      assert.ok(Jeeves.prototype.ingest);
    });

    xit('can start and stop', async function () {
      const jeeves = new Jeeves({
        connect: false
      });

      await jeeves.start();
      await jeeves.stop();

      assert.ok(jeeves);
    });

    xit('can execute the test prompt', function (done) {
      async function test () {
        const prompt = 'You are TestAI, a helpful and informative agent which responds to all prompts with: echo $TEST';
        const jeeves = new Jeeves({
          connect: false,
          openai: settings.openai,
          prompt: prompt
        });

        jeeves.on('response', async (response) => {
          assert.ok(response.openai);
          await jeeves.stop();
          done();
        });

        await jeeves.start();

        const response = await jeeves._handleRequest({
          input: 'Who are you?'
        });

        assert.ok(response.openai);

        // Properties
        assert.strictEqual(jeeves.status, 'STARTED');
      }

      test();
    });
  });

  describe('@jeeves/core/types/learner', function () {
    xit('should instantiate without error', function () {
      const learner = new Learner();
      assert.ok(learner);
    });

    xit('start and stop without error', function (done) {
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

    xit('can execute more than 200 ticks per second', function (done) {
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
