'use strict';

const EventEmitter = require('events').EventEmitter;

class Source extends EventEmitter {
  constructor (configuration = {}) {
    super(configuration);
    this.config = configuration;
  }
}

module.exports = Source;
