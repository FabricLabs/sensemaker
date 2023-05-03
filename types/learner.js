'use strict';

const HEADER_SIZE = 8;
const CHUNK_SIZE = 8;

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');
const Chain = require('@fabric/core/types/chain');
const Machine = require('@fabric/core/types/machine');

/**
 * Basic neural network support.
 */
class Learner extends Actor {
  /**
   * Create a neural network.
   * @param {Object} [settings] Settings for the network.
   * @returns {Learner} Instance of the network.
   */
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      parameters: [],
      constraints: {
        memory: {
          max: Math.pow(2, 26) // ~64MB RAM
        }
      },
      interval: 0 // 0 === as fast as possible, any other value in milliseconds
    }, settings);

    this.chain = new Chain();
    this.machine = new Machine();
    this._state = {
      status: 'STOPPED',
      content: {}
    };

    this._memory = Buffer.alloc(this.settings.constraints.memory.max, 0, 'hex');

    return this;
  }

  get clock () {
    return this._memory.slice(0, HEADER_SIZE).readBigUInt64BE(0);
  }

  get status () {
    return this._state.status;
  }

  get _maxChunks () {
    return Math.floor(this._effectiveMemory / CHUNK_SIZE);
  }

  get _effectiveMemory () {
    return this.settings.constraints.memory.max - HEADER_SIZE;
  }

  set clock (value) {
    this._memory.writeBigUInt64BE(value, 0);
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

  /**
   * Read a memory cell.
   * @param {Number} address Address of the cell.
   * @returns {Buffer} Value of the memory cell.
   */
  readChunk (address) {
    return this._readChunk(address);
  }

  /**
   * Write a buffer to memory.
   * @param {Number} address Address of the cell.
   * @param {Buffer} value Data to write to memory.
   * @returns {Number} Number of bytes written to the cell.
   */
  writeChunk (address, value) {
    return this._writeChunk(address, value);
  }

  _readChunk (address) {
    if (!address) throw new Error(`null pointer :: ${address}`);
    const start = HEADER_SIZE+(HEADER_SIZE*address);
    const end = start + CHUNK_SIZE;
    return Buffer.from(this._memory.slice(start, end), 'hex');
  }

  _writeChunk (address, value) {
    if (!address) throw new Error(`null pointer :: ${address}`);
    const start = HEADER_SIZE+(HEADER_SIZE*address);
    return value.copy(this._memory, start, CHUNK_SIZE);
  }

  async start () {
    this.status = 'STARTING';
    await this.chain.start();
    await this.machine.start();
    this._heart = setInterval(this.tick.bind(this), this.settings.interval);
    this.status = 'STARTED';
    return this;
  }

  async stop () {
    this.status = 'STOPPING';
    if (this._heart) clearInterval(this._heart);
    this._heart = null;
    await this.machine.stop();
    await this.chain.stop();
    this.status = 'STOPPED';
    return this;
  }
}

module.exports = Learner;
