'use strict';

const Actor = require('@fabric/core/types/actor');

/**
 * Simple clock.  Emits `tick` events at a specified interval.
 * @type {Object}
 */
class Clock extends Actor {
  constructor (settings = {}) {
    super(settings);

    this.config = Object.assign({
      interval: 60000
    }, settings);

    this.ticks = 0;
    this.timer = null;

    return this;
  }

  tick () {
    this.ticks++;
    this.commit();
    this.emit('tick', { id: this.ticks });
    return this.ticks;
  }

  async start () {
    this.timer = setInterval(this.tick.bind(this), this.config.interval);
    this.emit('ready', { id: this.id });
    return this;
  }
}

module.exports = Clock;
