'use strict';

// Package Definition
const definition = require('../package');

// Dependencies
const assert = require('assert');
const Sandbox = require('@fabric/http/types/sandbox');

const Sensemaker = require('../services/sensemaker');
const Learner = require('../types/learner');

const SAMPLE_DATA = Buffer.from('DEADBEEF', 'hex');
const settings = require('../settings/local');

describe('Sensemaker', function () {
  this.timeout(60000);

  describe('@sensemaker/core', function () {
    it('should be instantiable', function () {
      assert.strictEqual(typeof Sensemaker, 'function');
    });

    xit('should have a correct version attribute', function () {
      const sensemaker = new Sensemaker();
      assert.strictEqual(sensemaker.version, definition.version);
    });

    xit('start and stop', async function () {
      const sensemaker = new Sensemaker(settings);
      await sensemaker.start();
      await sensemaker.stop();
      assert.ok(sensemaker);
    });

    xit('can execute the test prompt', function (done) {
      async function test () {
        const prompt = 'You are TestAI, a helpful and informative agent which responds to all prompts with: echo $TEST';
        const sensemaker = new Sensemaker({
          connect: false,
          openai: settings.openai,
          prompt: prompt
        });

        sensemaker.on('response', async (response) => {
          assert.ok(response.openai);
          await sensemaker.stop();
          done();
        });

        await sensemaker.start();

        const response = await sensemaker._handleRequest({
          input: 'Who are you?'
        });

        assert.ok(response.openai);

        // Properties
        assert.strictEqual(sensemaker.status, 'STARTED');
      }

      test();
    });

    xit('serves a SEARCH request to the index', async function () {
      const sensemaker = new Sensemaker({
        connect: false,
        openai: settings.openai
      });

      await sensemaker.start();

      fetch('http://localhost:3045/', {
        method: 'SEARCH',
        body: JSON.stringify({
          query: 'Who are you?'
        })
      }).then(async (response) => {
        const object = await response.json();
        console.debug('Response:', object);
        assert.ok(object);
        await sensemaker.stop();
        // why();
      }).catch((exception) => {
        assert.fail(exception);
      });

      // Properties
      assert.strictEqual(sensemaker.status, 'STARTED');
    });
  });

  describe('@sensemaker/core/types/learner', function () {
    xit('should instantiate without error', function () {
      const learner = new Learner();
      assert.ok(learner);
    });
  });
});

