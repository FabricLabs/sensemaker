'use strict';

const EventEmitter = require('events').EventEmitter;

class Source extends EventEmitter {
  constructor (settings = {}) {
    super(settings);

    this.settings = settings;

    return this;
  }
}

module.exports = Source;
