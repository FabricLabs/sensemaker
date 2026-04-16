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
      debug: false,
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
      models: {}, // Top-level model tracking: { modelName: [{ provider: memberId, status: 'ready' }, ...] }
      memberModels: {}, // Legacy: models per member for backward compatibility
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
    this._state.memberModels[actor.id] = []; // Initialize with empty models list for backward compatibility

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
        let modelNames = [];
        try {
          const models = await this._state.members[memberId].listTags();
          modelNames = models.models.map((x) => x.name);
        } catch (error) {
          try {
            const alt = await this._state.members[memberId].listModels();
            modelNames = alt.models.map((x) => x.id);
          } catch (altError) {
            throw new Error(`Failed to list models: ${altError.message}`);
          }
        }

        // Update member->models mapping (for backward compatibility)
        this._state.memberModels[memberId] = modelNames;

        // Update top-level model->providers mapping
        const memberStatus = 'ready';
        this._state.memberStatus[memberId] = memberStatus;

        for (const modelName of modelNames) {
          if (!this._state.models[modelName]) {
            this._state.models[modelName] = [];
          }
          // Check if provider already exists for this model
          const existingProvider = this._state.models[modelName].find(p => p.provider === memberId);
          if (!existingProvider) {
            this._state.models[modelName].push({
              provider: memberId,
              status: memberStatus
            });
          } else {
            existingProvider.status = memberStatus;
          }
        }

        if (this.settings.debug) console.debug(`[SENSEMAKER] [POOL] Member ${memberId} initialized with models:`, modelNames);
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
    // Use top-level model tracking to find providers
    const modelProviders = this._state.models[request.model] || [];
    const candidateMembers = modelProviders
      .filter(provider => provider.status === 'ready')
      .map(provider => provider.provider)
      .filter(memberID => {
        const isHealthy = this._state.memberStatus[memberID] === 'ready';
        return isHealthy && !this._state.outstanding[memberID];
      });

    if (candidateMembers.length === 0) {
      throw new Error('No suitable healthy member found for the request');
    }

    // Find available member (already filtered above, but take first available)
    const availableMember = candidateMembers[0];
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
        let modelNames = [];
        try {
          const models = await this._state.members[memberID].listTags();
          modelNames = models.models.map((x) => x.name);
        } catch (error) {
          const alt = await this._state.members[memberID].listModels();
          modelNames = alt.models.map((x) => x.name);
        }

        // Update member->models mapping (for backward compatibility)
        this._state.memberModels[memberID] = modelNames;

        // Update top-level model->providers mapping
        const memberStatus = this._state.memberStatus[memberID] || 'ready';
        for (const modelName of modelNames) {
          if (!this._state.models[modelName]) {
            this._state.models[modelName] = [];
          }
          // Check if provider already exists for this model
          const existingProvider = this._state.models[modelName].find(p => p.provider === memberID);
          if (!existingProvider) {
            this._state.models[modelName].push({
              provider: memberID,
              status: memberStatus
            });
          } else {
            existingProvider.status = memberStatus;
          }
        }
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

    if (this.settings.debug) console.debug('[SENSEMAKER] [POOL] pool started, initializing members in background');
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
