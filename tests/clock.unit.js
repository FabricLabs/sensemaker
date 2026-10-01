'use strict';

const assert = require('assert');

const Clock = require('../types/clock');

describe('types/clock.js', function () {
  it('exports a class', function () {
    assert.strictEqual(typeof Clock, 'function');
  });

  it('instantiates with a default interval of 60000ms', function () {
    const clock = new Clock();
    assert.strictEqual(clock.config.interval, 60000);
  });

  it('honors a custom interval', function () {
    const clock = new Clock({ interval: 100 });
    assert.strictEqual(clock.config.interval, 100);
  });

  it('starts at zero ticks', function () {
    const clock = new Clock();
    assert.strictEqual(clock.ticks, 0);
  });

  it('increments ticks and emits a "tick" event on tick()', function () {
    const clock = new Clock();
    let received = null;
    clock.on('tick', (payload) => { received = payload; });
    const value = clock.tick();
    assert.strictEqual(value, 1);
    assert.strictEqual(clock.ticks, 1);
    assert.deepStrictEqual(received, { id: 1 });
  });

  it('start() schedules ticks and emits "ready"', function (done) {
    const clock = new Clock({ interval: 25 });
    let ready = false;
    clock.on('ready', () => { ready = true; });
    clock.start().then(() => {
      assert.ok(clock.timer, 'timer should be set');
      assert.strictEqual(ready, true);
      clearInterval(clock.timer);
      done();
    }).catch(done);
  });
});
