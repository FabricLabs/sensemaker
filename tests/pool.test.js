'use strict';

// Dependencies
const assert = require('assert');

// Settings
const settings = require('../settings/local');

// Fabric Types
const Pool = require('../types/pool');

describe('Pool', function () {
  let pool;

  this.timeout(120000);

  beforeEach(async function () {
    pool = new Pool({
      members: [ settings.ollama ],
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

  it('should initialize with default settings', function () {
    assert.strictEqual(pool.settings.members.length, 1);
    assert.strictEqual(pool.settings.state.status, 'STOPPED');
  });

  it('should respond to a query', async function () {
    const request = pool.query({
      model: 'qwen3:0.6b',
      query: 'Who are you?',
      temperature: 0,
    });

    console.debug('request:', request);

    request.catch((error) => {
      console.error('Error processing request:', error);
      assert.fail('Request should not fail');
    });

    request.then((response) => {
      assert.strictEqual(response.status, 'completed');
      assert.strictEqual(response.query, 'Who are you?');
      assert.ok(response.content);
    });
  });

  it('can use foreign providers', async function () {
    const foreignPool = new Pool({
      members: [
        {
          ...settings.ollama,
          model: 'deepseek/deepseek-r1-0528:free',
          host: 'openrouter.ai',
          port: 443,
          secure: true,
          path: '/api/v1',
          headers: {
            'Authorization': `Bearer ${settings.openrouter.token}`,
            'Content-Type': 'application/json'
          }
        }
      ],
      methods: {},
      models: {},
      state: {
        jobs: {},
        members: {},
        status: 'STOPPED'
      }
    });

    await foreignPool.start();

    const response = await foreignPool.query({
      model: 'deepseek/deepseek-r1-0528:free',
      query: 'What is the capital of France?',
      temperature: 0,
    });

    await foreignPool.stop();

    assert.strictEqual(response.status, 'success');
    assert.strictEqual(response.query, 'What is the capital of France?');
    assert.ok(response.content);
  });
});
