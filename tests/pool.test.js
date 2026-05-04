'use strict';

// Dependencies
const assert = require('assert');
const Actor = require('@fabric/core/types/actor');

// Fabric Types
const Pool = require('../types/pool');

describe('Pool', function () {
  let pool;

  this.timeout(120000);

  beforeEach(async function () {
    pool = new Pool({
      members: [],
      methods: {},
      models: {},
      state: {
        jobs: {},
        members: {},
        status: 'STOPPED'
      }
    });

    pool.registerMethod('GenerateReply', async (job) => {
      console.trace('processing job:', job);
      // Simulate job processing
      return new Promise((resolve) => {
        setTimeout(() => {
          job.status = 'completed';
          resolve(job);
        }, 100);
      });
    });

    await pool.start();
  });

  afterEach(async function () {
    await pool.stop();
  });

  it('should initialize and start cleanly', function () {
    assert.strictEqual(pool.settings.members.length, 0);
    assert.strictEqual(pool._state.content.status, 'STARTED');
  });

  it('should respond to a query via a ready member', async function () {
    const memberId = new Actor({ provider: 'unit-test' }).id;
    pool._state.members[memberId] = {
      query: async (request) => ({
        status: 'completed',
        query: request.query,
        content: 'ok'
      })
    };
    pool._state.memberStatus[memberId] = 'ready';
    pool._state.models['qwen3:0.6b'] = [{ provider: memberId, status: 'ready' }];

    const response = await pool.query({
      model: 'qwen3:0.6b',
      query: 'Who are you?',
      temperature: 0
    });

    assert.strictEqual(response.status, 'completed');
    assert.strictEqual(response.query, 'Who are you?');
    assert.strictEqual(response.content, 'ok');
  });

  it('throws when no suitable member exists for the requested model', async function () {
    await assert.rejects(
      pool.query({
        model: 'deepseek/deepseek-r1-0528:free',
        query: 'What is the capital of France?',
        temperature: 0
      }),
      /No suitable healthy member found/
    );
  });
});
