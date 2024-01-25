'use strict';

// Constants
const {
  AGENT_MAX_TOKENS,
  AGENT_TEMPERATURE,
  CHATGPT_MAX_TOKENS,
  MAX_MEMORY_SIZE
} = require('../constants');

// Local Constants
const FAILURE_PROBABILTY = 0;

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
      fabric: {
        listen: false,
      },
      parameters: {
        temperature: AGENT_TEMPERATURE,
        max_tokens: AGENT_MAX_TOKENS
      },
      model: 'gpt-4-1106-preview',
      prompt: 'You are Sensemaker, an artificial intelligence.  You are a human-like robot who is trying to understand the world around you.  You are able to learn from your experiences and adapt to new situations.',
      rules: [
        'do not provide hypotheticals or rely on hypothetical information (hallucinations)'
      ],
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
      },
      documentation: {
        description: 'The Agent service is responsible for managing an AI agent.  AI agents are self-contained actors which emit messages to a subscriber, which may be a human or another AI agent.',
        type: 'Service',
        methods: {
          query: {
            description: 'Query the AI agent.',
            parameters: {
              query: {
                type: 'String',
                description: 'The query to send to the AI agent.'
              }
            },
            returns: {
              type: 'Object',
              description: 'The response from the AI agent.'
            }
          },
          searchHost: {
            type: 'function',
            function: {
              name: 'search_host',
              description: 'Search the specified host for a query.',
              parameters: {
                type: 'object',
                properties: {
                  host: {
                    type: 'string',
                    description: 'The host to search.'
                  },
                  query: {
                    type: 'string',
                    description: 'The JSON-encoded query object to send to the host.'
                  }
                },
                required: ['host']
              }
            }
          }
        }
      }
    }, settings);

    // Fabric Agent
    this.fabric = new Peer({
      name: 'fabric',
      description: 'The Fabric agent, which manages a Fabric node for the AI agent.  Fabric is peer-to-peer network for running applications which store and exchange information paid in Bitcoin.',
      type: 'Peer',
      listen: this.settings.fabric.listen
    });

    // Assign prompts
    this.settings.openai.model = this.settings.model;
    // TODO: add configurable rules
    this.settings.openai.prompt = `RULES:\n- ${this.settings.rules.join('\n- ')}\n\n` + this.settings.prompt;

    // Services
    this.services = {
      mistral: new Mistral(this.settings.mistral),
      openai: new OpenAIService(this.settings.openai)
    };

    // Memory
    Object.defineProperty(this, 'memory', {
      get: function () {
        return Buffer.from(state.memory);
      }
    });

    // State
    Object.defineProperty(this, 'state', {
      get: function () {
        return JSON.parse(JSON.stringify(state));
      }
    });

    // Local State
    this._state = {
      model: this.settings.model,
      content: this.settings.state,
      prompt: this.settings.prompt
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

  get functions () {
    return this.settings.documentation.methods;
  }

  get model () {
    return this._state.model;
  }

  get tools () {
    return Object.values(this.settings.documentation.methods).filter((x) => {
      return (x.type == 'function');
    });
  }

  set prompt (value) {
    this._state.prompt = value;
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

  async query (request) {
    return new Promise(async (resolve, reject) => {
      this.emit('debug', '[AGENT]', 'Querying:', request);
      const responses = {
        alpha: null,
        beta: null,
        gamma: null,
        mistral: null,
        openai: await this.services.openai._streamConversationRequest({
          messages: [
            { role: 'system', content: this.prompt },
            { role: 'user', content: request.query }
          ],
          tools: this.tools
        }),
        rag: null,
        sensemaker: null
      };

      // Wait for all responses to resolve or reject.
      await Promise.allSettled(Object.values(responses));
      console.debug('[AGENT]', 'Prompt:', this.prompt);
      console.debug('[AGENT]', 'Query:', request.query);
      console.debug('[AGENT]', 'Responses:', responses);

      let response = '';

      if (FAILURE_PROBABILTY > Math.random()) {
        response = 'I am sorry, I do not understand.';
      } else if (responses.openai && responses.openai.content) {
        response = responses.openai.content;
      } else {
        response = 'I couldn\'t find enough resources to respond to that.  Try again later?';
      }

      resolve({
        type: 'AgentResponse',
        status: 'success',
        query: request.query,
        response: response,
        content: response
      });
    });
  }

  loadDefaultPrompt () {
    try {
      this.prompt = fs.readFileSync('./prompts/default.txt', 'utf8');
    } catch (exception) {
      console.error('[AGENT]', 'Could not load default prompt:', exception);
    }
  }

  start () {
    return new Promise((resolve, reject) => {
      this.fabric.start().then((node) => {
        this.emit('debug', '[FABRIC]', 'Node:', node.id);

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
        // this.services.mistral.start();

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
