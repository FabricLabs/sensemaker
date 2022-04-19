'use strict';

const Clock = require('./clock');

class Source extends Clock {
  constructor (settings = {}) {
    super(settings);

    this.settings = settings;

    return this;
  }
}

module.exports = Source;
