'use strict';

const Actor = require('@fabric/core/types/actor');

class Job extends Actor {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      method: new Function()
    }, this.settings, settings);

    this._state = {
      status: 'PAUSED',
      content: {}
    };

    return this;
  }

  async execute (input = null) {
    this._state.status = 'STARTED';
    const result = this.settings.method(input);
    this._state.status = 'COMPLETED';
    return result;
  }
}

module.exports = Job;
