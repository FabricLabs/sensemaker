'use strict';

const Service = require('@fabric/core/types/service');

class HuggingFaceService extends Service {
  constructor (settings = {}) {
    super(settings);
    this.settings = Object.assign({
      name: 'huggingface',
      description: 'A service for interacting with a HuggingFace-based AI.',
      version: '0.0.1',
      model: 'gpt-4-1106-preview',
    }, settings);
  }
}

module.exports = HuggingFaceService;
