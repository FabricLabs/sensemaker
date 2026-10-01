'use strict';

const Actor = require('@fabric/core/types/actor');

class Hit extends Actor {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      event: null,
      tags: [],
      timestamp: null
    }, this.settings, settings);

    this._state = {
      content: {
        event: this.settings.event,
        tags: this.settings.tags,
        timestamp: this.settings.timestamp
      }
    };

    return this;
  }
}

module.exports = Hit;
