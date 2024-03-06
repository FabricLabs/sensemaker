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
  /**
   * Create an instance of an {@link Agent}.
   * @param {Object} [settings] Settings for the Agent.
   * @param {String} [settings.name] The name of the agent.
   * @param {String} [settings.type] The type of the agent.
   * @param {String} [settings.description] The description of the agent.
   * @param {Number} [settings.frequency] The frequency at which the agent operates.
   * @param {Object} [settings.database] The database settings for the agent.
   * @param {Object} [settings.fabric] The Fabric settings for the agent.
   * @param {Object} [settings.parameters] The parameters for the agent.
   * @param {String} [settings.model] The model for the agent.
   * @returns {Agent} Instance of the Agent.
   */
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
      host: null,
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
      model: 'llama2',
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
                  path: {
                    type: 'string',
                    description: 'The path to search.'
                  },
                  body: {
                    type: 'object',
                    description: 'Query object to send to host, with required string parameter "query" designating the search term.',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'The search term.'
                      }
                    }
                  }
                },
                required: ['host', 'path', 'body']
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
    // this.settings.openai.model = this.settings.model;
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

  /**
   * Query the agent with some text.
   * @param {Object} request Request object.
   * @param {String} request.query The query to send to the agent.
   * @returns {AgentResponse} Response object.
   */
  async query (request) {
    return new Promise(async (resolve, reject) => {
      console.debug('[AGENT]', 'Querying:', request);
      console.debug('[!!!]', '[TODO]', '[PROMETHEUS]', 'Trigger Prometheus here!');
      if (this.settings.debug) console.debug('[AGENT]', 'Querying:', request);
      if (!request.messages) request.messages = [];

      // Prepare messages
      let messages = null;

      // Ensure system message is first
      if (!request.messages[0] || request.messages[0].role !== 'system') {
        messages = [{ role: 'system', content: this.prompt }].concat(request.messages);
      } else {
        messages = [].concat(request.messages);
      }

      // Check for local agent
      if (this.settings.host) {
        // Happy Path
        if (this.settings.debug) console.debug('[AGENT]', '[QUERY]', 'Fetching completions from local agent:', this.settings.host);

        // Clean up extraneous appearance of "agent" role
        messages = messages.map((x) => {
          if (x.role === 'agent') x.role = 'assistant';
          return x;
        });

        let response = null;
        let base = null;

        try {
          const sample = messages.concat([
            { role: 'user', content: request.query }
          ]);

          console.debug('[AGENT]', '[QUERY]', 'Trying with messages:', sample);

          response = await fetch(`http://${this.settings.host}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: this.settings.model,
              prompt: this.prompt,
              messages: sample
            })
          });

          console.debug('[AGENT]', '[QUERY]', 'Response:', response);

          base = await response.json();
          if (this.settings.debug) console.debug('[AGENT]', '[QUERY]', 'Response:', base);

          if (request.requery) {
            sample.push({ role: 'assistant', content: base.choices[0].message.content });
            console.debug('[AGENT]', '[REQUERY]', 'Messages:', sample);
            console.debug('[AGENT]', '[REQUERY]', 'Prompt:', this.prompt);
            // Re-execute query with John Cena
            return this.query({ query: `Are you sure about that?`, messages: sample }).catch(reject).then(resolve);
          }

          this.emit('completion', base);

          return resolve({
            type: 'AgentResponse',
            name: this.settings.name,
            status: 'success',
            query: request.query,
            response: base,
            content: base.choices[0].message.content,
            messages: messages
          });
        } catch (exception) {
          console.error('[AGENT]', 'Could not fetch completions:', exception);
          return reject(exception);
        }
      } else {
        // Failure Path
        const responses = {
          alpha: null,
          beta: null,
          gamma: null,
          mistral: null,
          openai: (this.settings.openai.enable) ? await this.services.openai._streamConversationRequest({
            messages:  messages.concat([
              { role: 'user', content: request.query }
            ]),
            tools: this.tools
          }) : null,
          rag: null,
          sensemaker: null
        };

        // Wait for all responses to resolve or reject.
        await Promise.allSettled(Object.values(responses));
        console.debug('[AGENT]', '[FALLBACK]', 'Prompt:', this.prompt);
        console.debug('[AGENT]', '[FALLBACK]', 'Query:', request.query);
        console.debug('[AGENT]', '[FALLBACK]', 'Responses:', responses);

        let response = '';

        if (FAILURE_PROBABILTY > Math.random()) {
          response = 'I am sorry, I do not understand.';
        } else if (responses.llama) {
          response = responses.llama.content;
        } else if (responses.openai && responses.openai.content) {
          response = responses.openai.content;
        } else {
          console.debug('[AGENT]', 'No response:', responses);
          response = 'I couldn\'t find enough resources to respond to that.  Try again later?';
        }

        return resolve({
          type: 'AgentResponse',
          name: this.settings.name,
          status: 'success',
          query: request.query,
          response: response,
          content: response
        });
      }
    });
  }

  async requery (request, timeout = 120000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Requery timed out.'));
      }, timeout);

      this.query(request).then((response) => {
        clearTimeout(timer);
        resolve(response);
      }).catch(reject);
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
