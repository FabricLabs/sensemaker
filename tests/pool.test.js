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

  // Helper method to wait for pool to be ready
  async function waitForPoolReady (pool) {
    const maxAttempts = 30;
    const delay = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      const health = pool.getPoolHealth();

      if (health.isHealthy) {
        return;
      }

      if (i < maxAttempts - 1) {
        console.debug(`Pool not ready yet, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Pool failed to become ready within expected time');
  }

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
      // Simulate job processing
      return new Promise((resolve) => {
        setTimeout(() => {
          job.status = 'completed';
          resolve(job);
        }, 100);
      });
    });
  });

  afterEach(async function () {
    if (pool._state.content.status === 'STARTED') {
      await pool.stop();
      // Small delay to ensure all timeouts are cleared
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  it('should initialize with default settings', function () {
    assert.strictEqual(pool.settings.members.length, 1);
    assert.strictEqual(pool._state.content.status, 'STOPPED');
  });

  it('should start with default settings', async function () {
    await pool.start();

    // Wait for pool to be ready
    await waitForPoolReady(pool);

    assert.strictEqual(pool.settings.members.length, 1);
    assert.strictEqual(pool._state.content.status, 'STARTED');
  });

  it('should respond to a query', async function () {
    await pool.start();

    // Wait for pool to be ready
    await waitForPoolReady(pool);

    try {
      const response = await pool.query({
        model: 'qwen3:0.6b',
        query: 'Who are you?',
        temperature: 0,
      });

      assert.ok(response);
      assert.ok(response.content);
      assert.strictEqual(response.query, 'Who are you?');
    } catch (error) {
      console.error('Query failed:', error);
      console.error('Pool health:', pool.getPoolHealth());
      throw error;
    }
  });

  xit('can use foreign providers', async function () {
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
