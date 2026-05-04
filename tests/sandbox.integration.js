'use strict';

const assert = require('assert');

const Sandbox = require('@fabric/http/types/sandbox');

describe('Sandbox Integration Tests', function () {
  it('is instantiable with default settings', function () {
    const sandbox = new Sandbox();
    assert.ok(sandbox);
    assert.strictEqual(sandbox._state.content.status, 'PAUSED');
    assert.strictEqual(sandbox.browser, null);
    assert.strictEqual(sandbox.chromium, null);
    assert.deepStrictEqual(sandbox.requests, []);
  });

  it('exposes lifecycle and browser helper methods', function () {
    const sandbox = new Sandbox();
    assert.strictEqual(typeof sandbox.start, 'function');
    assert.strictEqual(typeof sandbox.stop, 'function');
    assert.strictEqual(typeof sandbox._navigateTo, 'function');
    assert.strictEqual(typeof sandbox.download, 'function');
    assert.strictEqual(typeof sandbox.export, 'function');
  });

  it('export() returns the evaluated outer HTML', async function () {
    const sandbox = new Sandbox();
    sandbox.browser = {
      evaluate: async (fn) => {
        assert.strictEqual(typeof fn, 'function');
        return '<html><body><h1>ok</h1></body></html>';
      }
    };

    const html = await sandbox.export();
    assert.ok(html.includes('<h1>ok</h1>'));
  });

  it('_navigateTo() delegates to goto and waitForNavigation', async function () {
    const calls = [];
    const sandbox = new Sandbox();
    sandbox.browser = {
      goto: async (url) => {
        calls.push(['goto', url]);
      },
      waitForNavigation: async () => {
        calls.push(['waitForNavigation']);
      }
    };

    await sandbox._navigateTo('https://example.com/');
    assert.deepStrictEqual(calls, [
      ['goto', 'https://example.com/'],
      ['waitForNavigation']
    ]);
  });

  it('download() resolves and returns the sandbox instance', async function () {
    let bufferCalled = false;
    const sandbox = new Sandbox();
    sandbox.browser = {
      goto: async () => ({
        buffer: async () => {
          bufferCalled = true;
          return Buffer.from('ok');
        }
      })
    };

    const result = await sandbox.download('https://example.com/file');
    assert.strictEqual(result, sandbox);
    assert.strictEqual(bufferCalled, true);
  });

  it('stop() closes browser and chromium handles when present', async function () {
    let browserClosed = false;
    let chromiumClosed = false;
    const sandbox = new Sandbox();
    sandbox.browser = { close: async () => { browserClosed = true; } };
    sandbox.chromium = { close: async () => { chromiumClosed = true; } };

    await sandbox.stop();
    assert.strictEqual(browserClosed, true);
    assert.strictEqual(chromiumClosed, true);
  });
});
