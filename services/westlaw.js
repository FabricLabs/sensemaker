'use strict';

const Service = require('@fabric/core/types/service');
const Sandbox = require('@fabric/http/types/sandbox');

class WestLaw extends Service {
  constructor (settings = {}) {
    super(settings);
    this.settings = merge({}, settings);
    this.sandbox = new Sandbox();
  }

  async start () {
    await this.sandbox.start();
  }

  async stop () {
    await this.sandbox.stop();
  }
}

module.exports = WestLaw;
