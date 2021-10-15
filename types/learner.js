'use strict';

const HEADER_SIZE = 8;

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');
const Chain = require('@fabric/core/types/chain');
const Machine = require('@fabric/core/types/machine');

class Learner extends Actor {
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      constraints: {
        memory: {
          max: Math.pow(2, 26) // ~64MB RAM
        }
      },
      interval: 0 // 0 === as fast as possible, any other value in milliseconds
    }, settings);

    this.chain = new Chain();
    this.machine = new Machine();
    this._state = { status: 'STOPPED' };
    this._memory = Buffer.alloc(this.settings.constraints.memory.max);

    return this;
  }

  get clock () {
    return this._memory.slice(0, HEADER_SIZE).readBigUInt64BE(0);
  }

  get status () {
    return this._state.status;
  }

  set clock (value) {
    this._memory.slice(0, HEADER_SIZE).writeBigUInt64BE(value, 0);
    return this.clock;
  }

  set status (value) {
    this._state.status = value.toUpperCase();
    return this.status;
  }

  dump () {
    return JSON.stringify({
      id: this.id,
      clock: this.clock,
      memory: this._memory
    }, null, '  ');
  }

  tick () {
    ++this.clock;
  }

  _readChunk (address) {
    if (!address) throw new Error(`null pointer :: ${address}`);
    const start = HEADER_SIZE+(HEADER_SIZE*address);
    const end = start + 8
    return this._memory.slice(start, end);
  }

  _writeChunk (address, value) {
    if (!address) throw new Error(`null pointer :: ${address}`);
    const start = HEADER_SIZE+(HEADER_SIZE*address);
    return this._memory.writeBigUInt64BE(value, start);
  }

  async start () {
    this.status = 'STARTING';
    await this.chain.start();
    await this.machine.start();
    this.status = 'STARTED';
    return this;
  }

  async stop () {
    this.status = 'STOPPING';
    await this.machine.stop();
    await this.chain.stop();
    this.status = 'STOPPED';
    return this;
  }
}

module.exports = Learner;
