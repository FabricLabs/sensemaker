'use strict';

// Package Definition
const definition = require('../package');

// Dependencies
const assert = require('assert');
const Sandbox = require('@fabric/http/types/sandbox');

const Jeeves = require('../services/jeeves');
const Learner = require('../types/learner');

const SAMPLE_DATA = Buffer.from('DEADBEEF', 'hex');
const settings = require('../settings/local');

describe('Jeeves', function () {
  this.timeout(60000);

  describe('@jeeves/core', function () {
    it('should be instantiable', function () {
      assert.strictEqual(typeof Jeeves, 'function');
    });

    xit('should have a correct version attribute', function () {
      const jeeves = new Jeeves();
      assert.strictEqual(jeeves.version, definition.version);
    });

    xit('start and stop', async function () {
      const jeeves = new Jeeves(settings);
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

    xit('serves a SEARCH request to the index', async function () {
      const jeeves = new Jeeves({
        connect: false,
        openai: settings.openai
      });

      await jeeves.start();

      fetch('http://localhost:3045/', {
        method: 'SEARCH',
        body: JSON.stringify({
          query: 'Who are you?'
        })
      }).then(async (response) => {
        const object = await response.json();
        console.debug('Response:', object);
        assert.ok(object);
        await jeeves.stop();
        // why();
      }).catch((exception) => {
        assert.fail(exception);
      });

      // Properties
      assert.strictEqual(jeeves.status, 'STARTED');
    });
  });

  describe('@jeeves/core/types/learner', function () {
    xit('should instantiate without error', function () {
      const learner = new Learner();
      assert.ok(learner);
    });
  });
});

