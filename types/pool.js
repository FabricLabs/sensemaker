'use strict';

// Constants
const {
  CORE_MODEL
} = require('../constants');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

// Local Types
const Agent = require('./agent');

/**
 * Manage a pool of member Agents to reliably queries.
 */
class Pool extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      members: [],
      methods: {},
      model: CORE_MODEL,
      models: {},
      timeout: 60000, // 60 second default timeout
      initTimeout: 30000, // 30 second timeout for member initialization
      state: {
        jobs: {},
        members: {},
        status: 'STOPPED'
      }
    }, settings);

    this._state = {
      content: this.settings.state,
      methods: {},
      members: {},
      models: {},
      names: {},
      outstanding: {},
      memberStatus: {} // Track member health/status
    };

    return this;
  }

  addJob (job) {
    const actor = new Actor(job);
    if (this._state.content.jobs[actor.id]) throw new Error(`Job with ID ${actor.id} already exists.`);
    job.status = 'pending';
    this._state.content.jobs[actor.id] = job;
    this.executeJobByID(actor.id);
  }

  async addMember (member) {
    const actor = new Actor(member);
    if (this._state.content.members[actor.id]) throw new Error(`Member with ID ${actor.id} already exists.`);

    // Add member immediately to allow for parallel initialization
    this._state.content.members[actor.id] = member;
    this._state.members[actor.id] = new Agent(member);
    this._state.memberStatus[actor.id] = 'initializing';
    this._state.models[actor.id] = []; // Initialize with empty models list

    // Initialize member with timeout
    this._initializeMember(actor.id).catch(error => {
      console.warn(`[SENSEMAKER] [POOL] Failed to initialize member ${actor.id}:`, error.message);
      this._state.memberStatus[actor.id] = 'failed';
    });

    return this;
  }

  async _initializeMember (memberId) {
    try {
      const initPromise = (async () => {
        try {
          const models = await this._state.members[memberId].listTags();
          this._state.models[memberId] = models.models.map((x) => x.name);
        } catch (error) {
          try {
            const alt = await this._state.members[memberId].listModels();
            this._state.models[memberId] = alt.models.map((x) => x.id);
          } catch (altError) {
            throw new Error(`Failed to list models: ${altError.message}`);
          }
        }
        this._state.memberStatus[memberId] = 'ready';
        console.debug(`[SENSEMAKER] [POOL] Member ${memberId} initialized with models:`, this._state.models[memberId]);
      })();

      // Race against timeout
      await Promise.race([
        initPromise,
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Member initialization timed out after ${this.settings.initTimeout}ms`));
          }, this.settings.initTimeout);
        })
      ]);
    } catch (error) {
      this._state.memberStatus[memberId] = 'failed';
      throw error;
    }
  }

  executeJobByID (id) {
    const job = this._state.content.jobs[id];

    if (!job) throw new Error(`Job with ID ${id} does not exist.`);
    if (job.status !== 'pending') throw new Error(`Job with ID ${id} is not in a pending state.`);

    this._state.content.jobs[id].status = 'running';

    const address = this._state.names[job.method];
    if (!address) throw new Error(`Method ${job.method} does not exist.`);
    const method = this._state.methods[address];

    try {
      const result = method(job.params);
      this._state.content.jobs[id].status = 'completed';
      this._state.content.jobs[id].result = result;
    } catch (error) {
      this._state.content.jobs[id].status = 'failed';
      this._state.content.jobs[id].error = error.message;
    }
  }

  registerMethod (name, method) {
    if (this._state.methods[name]) throw new Error(`Method with name ${name} already exists.`);
    const actor = new Actor({
      name: name,
      code: method.toString()
    });

    this._state.methods[actor.id] = method;
    this._state.names[name] = actor.id;
  }

  async query (request = {}) {
    if (!request.model) request.model = this.settings.model;
    if (!request.query) throw new Error('Query is required for the request');

    // Find members that can handle the request and are healthy
    const candidateMembers = Object.keys(this._state.members).filter(memberID => {
      const memberModels = this._state.models[memberID] || [];
      const isHealthy = this._state.memberStatus[memberID] === 'ready';
      return isHealthy && memberModels.includes(request.model);
    });

    if (candidateMembers.length === 0) {
      throw new Error('No suitable healthy member found for the request');
    }

    // Find available member (not currently processing a request)
    const availableMember = candidateMembers.find(memberID => !this._state.outstanding[memberID]);
    if (!availableMember) {
      throw new Error('All suitable members are currently busy');
    }

    // Create request tracking object
    const requestID = new Actor({ type: 'request' }).id;
    this._state.outstanding[availableMember] = {
      id: requestID,
      startTime: Date.now(),
      timeout: setTimeout(() => {
        this._handleRequestTimeout(availableMember, requestID);
      }, this.settings.timeout)
    };

    try {
      const result = await Promise.race([
        this._state.members[availableMember].query(request),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Request timed out after ${this.settings.timeout}ms`));
          }, this.settings.timeout);
        })
      ]);

      // Clean up request tracking
      this._cleanupRequest(availableMember);
      return result;
    } catch (error) {
      // Clean up request tracking
      this._cleanupRequest(availableMember);
      throw error;
    }
  }

  _handleRequestTimeout (memberID, requestID) {
    // Only handle timeout if this request is still the active one
    if (this._state.outstanding[memberID]?.id === requestID) {
      this._cleanupRequest(memberID);
      console.warn(`[SENSEMAKER] [POOL] Request to member ${memberID} timed out`);
    }
  }

  _cleanupRequest (memberID) {
    if (this._state.outstanding[memberID]) {
      clearTimeout(this._state.outstanding[memberID].timeout);
      delete this._state.outstanding[memberID];
    }
  }

  async syncModels () {
    for (const memberID in this._state.members) {
      try {
        const models = await this._state.members[memberID].listModels();
        this._state.models[memberID] = models.models.map((x) => x.name);
      } catch (error) {
        console.warn(`[SENSEMAKER] [POOL] Failed to sync models for member ${memberID}:`, error.message);
      }
    }
  }

  async start () {
    // Start adding members in parallel without waiting
    this.settings.members.forEach(member => {
      this.addMember(member).catch(error => {
        console.warn('[SENSEMAKER] [POOL] Failed to add member:', error.message);
      });
    });

    // Set status to started immediately
    this._state.content.status = 'STARTED';
    this.emit('started', this._state.content);

    console.debug('pool started, initializing members in background');
    return this;
  }

  async stop () {
    // Cancel any pending initialization timeouts
    Object.keys(this._state.memberStatus).forEach(memberId => {
      if (this._state.memberStatus[memberId] === 'initializing') {
        this._state.memberStatus[memberId] = 'stopped';
      }
    });

    this._state.content.status = 'STOPPED';
    return this;
  }

  // Add method to check pool health
  getPoolHealth () {
    const total = Object.keys(this._state.members).length;
    const ready = Object.values(this._state.memberStatus).filter(status => status === 'ready').length;
    const failed = Object.values(this._state.memberStatus).filter(status => status === 'failed').length;
    const initializing = Object.values(this._state.memberStatus).filter(status => status === 'initializing').length;

    return {
      total,
      ready,
      failed,
      initializing,
      isHealthy: ready > 0
    };
  }
}

module.exports = Pool;
