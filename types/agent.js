'use strict';

const {
  AGENT_MAX_TOKENS,
  AGENT_TEMPERATURE,
  CHATGPT_MAX_TOKENS,
  MAX_MEMORY_SIZE
} = require('../constants');

// Dependencies
const fs = require('fs');
const merge = require('lodash.merge');

// Fabric Types
const Peer = require('@fabric/core/types/peer');
const Service = require('@fabric/core/types/service');

// Sensemaker Services
const Mistral = require('../services/mistral');
const OpenAIService = require('../services/openai');

/**
 * The Agent service is responsible for managing an AI agent.  AI agents are self-contained actors which emit messages to a subscriber, which may be a human or another AI agent.
 * @type {Agent} An Agent is a type of Service.
 */
class Agent extends Service {
  constructor (settings = {}) {
    super(settings);

    // State
    const state = {
      status: 'initialized',
      memory: Buffer.alloc(MAX_MEMORY_SIZE),
      messages: [],
      hash: null,
      version: 0
    };

    // Settings
    this.settings = merge({
      name: 'agent',
      type: 'Sensemaker',
      description: 'An artificial intelligence.',
      frequency: 1, // 1 Hz
      database: {
        type: 'memory'
      },
      parameters: {
        temperature: AGENT_TEMPERATURE,
        max_tokens: AGENT_MAX_TOKENS
      },
      model: 'gpt-4-1106-preview',
      prompt: 'You are Sensemaker, an artificial intelligence.  You are a human-like robot who is trying to understand the world around you.  You are able to learn from your experiences and adapt to new situations.',
      timeout: {
        tolerance: 0.5 * 1000 // tolerance in seconds
      },
      constraints: {
        max_tokens: 4096
      },
      mistral: {
        authority: 'https://mistral.on.fabric.pub'
      },
      openai: {
        key: 'sk-1234567890abcdef1234567890abcdef',
        engine: 'davinci',
        temperature: AGENT_TEMPERATURE,
        max_tokens: CHATGPT_MAX_TOKENS,
        // top_p: 1,
        // frequency_penalty: 0,
        // presence_penalty: 0.6,
        // stop: ['\n'] // TODO: eliminate need for stop tokens
      }
    }, settings);

    // Fabric Agent
    this.fabric = new Peer({
      name: 'fabric',
      description: 'The Fabric agent, which manages a Fabric node for the AI agent.  Fabric is peer-to-peer network for running applications which store and exchange information paid in Bitcoin.',
      type: 'Peer',
      documentation: {
        name: 'Fabric',
        description: 'The Fabric Network agent, which manages a Fabric node for the AI agent.',
        methods: {
          ack: {
            description: 'Acknowledge a message.',
            parameters: {
              message: {
                // TODO: consider making this a FabricMessageID
                type: 'FabricMessage',
                description: 'The message to acknowledge.'
              }
            },
            returns: {
              type: 'Promise',
              description: 'A Promise which resolves to the completed FabricState.'
            }
          },
          send: {
            description: 'Send a message to a connected peer.',
            parameters: {
              message: {
                type: 'FabricMessage',
                description: 'The message to send to the peer.'
              }
            },
            returns: {
              type: 'Promise',
              description: 'A Promise which resolves to the agent\'s response (if any).'
            }
          },
          broadcast: {
            description: 'Broadcast a message to all connected nodes.',
            parameters: {
              message: {
                type: 'FabricMessage',
                description: 'The message to send to the node.'
              }
            },
            returns: {
              type: 'Promise',
              description: 'A Promise which resolves to the agents\' responses (if any).'
            }
          }
        }
      }
    });

    this.services = {
      mistral: new Mistral(this.settings.mistral),
      openai: new OpenAIService(this.settings.openai)
    };

    // State
    Object.defineProperty(this, 'state', {
      get: function () {
        return JSON.parse(JSON.stringify(state));
      }
    });

    // Memory
    Object.defineProperty(this, 'memory', {
      get: function () {
        return state.memory;
      }
    });

    this._state = {
      model: this.settings.model,
      content: this.settings.state
    };

    // Ensure chainability
    return this;
  }

  get interval () {
    return 1000 / this.settings.frequency;
  }

  get prompt () {
    return this._state.prompt;
  }

  set prompt (value) {
    this._state.prompt = value;
  }

  get model () {
    return this._state.model;
  }

  async _handleRequest (request) {
    switch (request.type) {
      case 'Query':
        return this.query(request.content);
      case 'Message':
        return this.message(request);
      case 'MessageChunk':
        return this.messageChunk(request);
      case 'MessageStart':
        return this.messageStart(request);
      case 'MessageEnd':
        return this.messageEnd(request);
      case 'MessageAck':
        return this.messageAck(request);
      default:
        throw new Error(`Unhandled Agent request type: ${request.type}`);
    }
  }

  query (request) {
    return new Promise((resolve, reject) => {
      this.emit('debug', '[AGENT]', 'Querying:', request);
      resolve({
        status: 'success',
        query: request.query
      });
    });
  }

  loadDefaultPrompt () {
    try {
      this.prompt = fs.readFileSync('../prompts/default.txt', 'utf8');
    } catch (exception) {
      console.error('[AGENT]', 'Could not load default prompt:', exception);
    }
  }

  start () {
    return new Promise((resolve, reject) => {
      this.fabric.start().then((node) => {
        this.emit('debug', '[FABRIC]', 'Node:', node);

        // Load default prompt.
        this.loadDefaultPrompt();

        // Attach event handlers.
        this.services.mistral.on('debug', (...msg) => {
          console.debug('[AGENT]', '[MISTRAL]', '[DEBUG]', ...msg);
        });

        this.services.mistral.on('ready', () => {
          console.log('[AGENT]', '[MISTRAL]', 'Ready.');
        });

        this.services.mistral.on('message', (msg) => {
          console.log('[AGENT]', '[MISTRAL]', 'Message received:', msg);
        });

        this.services.openai.on('debug', (...msg) => {
          console.debug('[AGENT]', '[OPENAI]', '[DEBUG]', ...msg);
        });

        // Start Mistral.
        this.services.mistral.start();

        // Start OpenAI.
        this.services.openai.start();

        // Assert that Agent is ready.
        this.emit('ready');

        // Resolve with Agent.
        resolve(this);
      }).catch(reject);
    });
  }

  stop () {
    return new Promise((resolve, reject) => {
      this.fabric.stop().then(() => {
        this.emit('stopped');

        resolve(this);
      }).catch(reject);
    });
  }
}

module.exports = Agent;
