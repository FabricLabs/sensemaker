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

// Defaults
const defaults = require('../settings/local');

// Dependencies
const fs = require('fs');
const merge = require('lodash.merge');
const fetch = require('cross-fetch');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Peer = require('@fabric/core/types/peer');
const Service = require('@fabric/core/types/service');
const Message = require('@fabric/core/types/message');

// LLM Types
const { Document } = require('@langchain/core/documents');

// Sensemaker Services
// const Mistral = require('../services/mistral');
// const OpenAIService = require('../services/openai');

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
      host: defaults.ollama.host,
      port: defaults.ollama.port,
      secure: defaults.ollama.secure,
      database: {
        type: 'memory'
      },
      fabric: {
        listen: false,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      parameters: {
        temperature: AGENT_TEMPERATURE,
        max_tokens: AGENT_MAX_TOKENS
      },
      model: defaults.ollama.model,
      prompt: 'You are Sensemaker, an artificial intelligence.  You are a human-like robot who is trying to understand the world around you.  You are able to learn from your experiences and adapt to new situations.',
      rules: [
        'do not provide hypotheticals or rely on hypothetical information (hallucinations)'
      ],
      timeout: {
        tolerance: 30 * 1000 // tolerance in seconds
      },
      constraints: {
        max_tokens: AGENT_MAX_TOKENS,
        tokens: {
          max: AGENT_MAX_TOKENS
        }
      },
      mistral: {
        authority: 'https://mistral.on.fabric.pub'
      },
      openai: {
        enable: false,
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
          http_get: {
            type: 'function',
            function: {
              name: 'http_get',
              description: 'Perform an HTTP GET request.',
              parameters: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'The URL to fetch.'
                  }
                },
                required: ['url']
              }
            }
          },
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
          }
        }
      },
      state: {
        fabric: {
          tip: null
        },
        status: 'STOPPED',
        workers: []
      }
    }, settings);

    // Fabric Agent
    this.fabric = new Peer({
      name: 'fabric',
      description: 'The Fabric agent, which manages a Fabric node for the AI agent.  Fabric is peer-to-peer network for running applications which store and exchange information paid in Bitcoin.',
      key: this.settings.key,
      type: 'Peer',
      listen: this.settings.fabric.listen
    });

    // Assign prompts
    // this.settings.openai.model = this.settings.model;
    // TODO: add configurable rules
    this.settings.openai.prompt = `RULES:\n- ${this.settings.rules.join('\n- ')}\n\n` + this.settings.prompt;

    // Services
    this.services = {
      // mistral: new Mistral(this.settings.mistral),
      // openai: new OpenAIService(this.settings.openai)
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
    if (!this.settings.tools) return [];
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

  async prime () {
    if (!this.settings.host) return { done: true };
    return new Promise((resolve, reject) => {
      if (this.settings.debug) console.debug('[AGENT]', `[${this.settings.name}]`, 'Priming:', this.settings.model);
      fetch(`http${(this.settings.secure) ? 's' : ''}://${this.settings.host}:${this.settings.port}/api/generate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: this.settings.model })
      }).then(async (response) => {
        return response.json();
      }).then((json) => {
        console.debug('[AGENT]', `[${this.settings.name}]`, 'Primed:', json);
        resolve(json);
      }).catch(reject);
    });
  }

  /**
   * Query the agent with some text.
   * @param {Object} request Request object.
   * @param {String} request.query The query to send to the agent.
   * @returns {AgentResponse} Response object.
   */
  async query (request) {
    // TODO: streamline this method to remove await
    return new Promise(async (resolve, reject) => {
      if (this.settings.debug) console.debug('[AGENT]', 'Name:', this.settings.name);
      if (this.settings.debug) console.debug('[AGENT]', 'Host:', this.settings.host);
      if (this.settings.debug) console.debug('[AGENT]', 'Model:', this.settings.model);
      if (this.settings.debug) console.debug('[AGENT]', `[${this.settings.name.toUpperCase()}]`, 'Prompt:', this.prompt);
      if (this.settings.debug) console.debug('[AGENT]', `[${this.settings.name.toUpperCase()}]`, 'Querying:', request);
      if (!request.messages) request.messages = [];

      // Create timeout handler
      const timeoutId = setTimeout(() => {
        reject(new Error(`Query timed out after ${this.settings.timeout.tolerance}ms`));
      }, this.settings.timeout.tolerance);

      try {
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
          if (this.settings.debug) console.debug('[AGENT]', `[${this.settings.name.toUpperCase()}]`, '[QUERY]', 'Fetching completions from local agent:', this.settings.host);
          const endpoint = `http${(this.settings.secure) ? 's' : ''}://${this.settings.host}:${this.settings.port}/v1/chat/completions`;

          // Clean up extraneous appearance of "agent" role
          messages = messages.map((x) => {
            if (x.role === 'agent') x.role = 'assistant';
            return x;
          });

          let response = null;
          let text = null;
          let base = null;
          let format = null;

          if (request.format === 'json' || request.json) {
            format = 'json';
          } else if (request.format) {
            try {
              format = JSON.parse(request.format);
            } catch {
              console.error('[AGENT]', `[${this.settings.name.toUpperCase()}]`, 'Could not parse format as JSON:', request.format);
              clearTimeout(timeoutId);
              return reject(new Error('Invalid format specified.'));
            }
          }

          const sample = messages.concat([
            { role: 'user', username: request.username, content: request.query }
          ]);

          if (this.settings.debug) console.debug('[AGENT]', `[${this.settings.name.toUpperCase()}]`, '[QUERY]', 'Trying with messages:', sample);

          // Core Request with AbortController for timeout
          const controller = new AbortController();
          const signal = controller.signal;

          try {
            response = await fetch(endpoint, {
              method: 'POST',
              headers: merge({
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }, this.settings.headers),
              body: JSON.stringify({
                model: this.settings.model,
                keep_alive: (this.settings.keepalive) ? -1 : undefined,
                messages: sample,
                format: format,
                options: {
                  temperature: this.settings.temperature,
                  max_tokens: this.settings.max_tokens
                },
                tools: (request.tools) ? this.tools : undefined,
                stream: false
              }),
              signal
            });

            if (!response) {
              clearTimeout(timeoutId);
              return reject(new Error('No response from agent.'));
            }

            text = await response.text();
            base = JSON.parse(text);

            if (!base) {
              clearTimeout(timeoutId);
              return reject(new Error('No response from agent.'));
            }

            if (base.error) {
              clearTimeout(timeoutId);
              return reject(base.error);
            }

            const choice = base.choices[0];

            // TODO: refactor this to use `this.tools` and implement `registerTool(name, method)
            if (choice.finish_reason && choice.finish_reason === 'tool_calls') {
              const tool = choice.message.tool_calls[0];
              const args = JSON.parse(tool.function.arguments);
              switch (tool.function.name) {
                // Simple HTTP GET
                case 'http_get':
                  try {
                    const tool_response = await fetch(args.url);
                    const obj = {
                      role: 'tool',
                      content: await tool_response.text(),
                      tool_call_id: tool.tool_call_id
                    };

                    const actor = new Actor({ content: obj.content });
                    this.emit('document', {
                      id: actor.id,
                      content: obj.content
                    });

                    messages.push(choice.message);
                    messages.push({ role: 'tool', content: obj.content, tool_call_id: tool.id });
                  } catch (exception) {
                    clearTimeout(timeoutId);
                    reject(exception);
                  }

                  clearTimeout(timeoutId);
                  return this.query({ query: request.query, messages: messages }).then(resolve).catch(reject);
              }
            }

            if (!base.choices) {
              clearTimeout(timeoutId);
              return reject(new Error('No choices in response.'));
            }

            // Emit completion event
            this.emit('completion', base);
            if (this.settings.debug) console.trace('[AGENT]', `[${this.settings.name.toUpperCase()}]`, '[QUERY]', 'Emitted completion:', base);

            // Clear timeout and resolve with response
            clearTimeout(timeoutId);
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
            clearTimeout(timeoutId);
            console.error('[AGENT]', `[${this.settings.name.toUpperCase()}]`, endpoint, 'Could not fetch completions:', exception);
            return resolve({
              type: 'AgentResponse',
              name: this.settings.name,
              status: 'error',
              query: request.query,
              response: null,
              content: text,
            });
          }
        } else {
          console.debug('[AGENT]', `[${this.settings.name.toUpperCase()}]`, '[QUERY]', 'No host specified, using fallback.');

          try {
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
                tools: (this.settings.tools) ? this.tools : undefined,
                json: request.json
              }) : null,
              rag: null,
              sensemaker: null
            };

            console.debug('[AGENT]',`[${this.settings.name.toUpperCase()}]`, '[FALLBACK]', 'Responses:', responses);

            // Wait for all responses to resolve or reject.
            await Promise.allSettled(Object.values(responses));
            console.debug('[AGENT]',`[${this.settings.name.toUpperCase()}]`, '[FALLBACK]', 'Prompt:', this.prompt);
            console.debug('[AGENT]',`[${this.settings.name.toUpperCase()}]`, '[FALLBACK]', 'Query:', request.query);
            console.debug('[AGENT]',`[${this.settings.name.toUpperCase()}]`, '[FALLBACK]', 'Responses:', responses);

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

            clearTimeout(timeoutId);
            return resolve({
              type: 'AgentResponse',
              name: this.settings.name,
              status: 'success',
              query: request.query,
              response: response,
              content: response
            });
          } catch (exception) {
            clearTimeout(timeoutId);
            return reject(exception);
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  async listModels () {
    fetch(`http${(this.settings.secure) ? 's' : ''}://${this.settings.host}:${this.settings.port}/api/models`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }).then((models) => {
      console.debug('[AGENT]', `[${this.settings.name.toUpperCase()}]`, '[LIST_MODELS]', 'Available models:', models);
      return models;
    }).catch((error) => {
      console.error('[AGENT]', `[${this.settings.name.toUpperCase()}]`, '[LIST_MODELS]', 'Error fetching models:', error);
      throw error;
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

  async ingestReferences () {
    return new Promise((resolve, reject) => {
      fs.readFile('./assets/bitcoin.pdf', async (error, whitepaper) => {
        if (error) {
          console.error('[AGENT]', 'Error reading whitepaper:', error);
          return;
        }

        // Store Documents
        // Web Application
        // const spa = await this.ui.load();
        // console.debug('[AGENT]', 'SPA:', spa);

        // Whitepaper
        // const contract = new Document({ pageContent: whitepaper.toString('utf8'), metadata: { type: 'text/markdown' } });
        // const contractChunks = await this.splitter.splitDocuments([contract]);
        // const chunks = await this.splitter.splitDocuments(spa);
        // const allDocs = [contract].concat(spa, contractChunks, chunks);
        // const allDocs = contractChunks.concat(chunks);

        const stub = new Document({ pageContent: 'Hello, world!', metadata: { type: 'text/plain' } });
        const allDocs = [ stub ];

        // TODO: use @fabric/core/types/filesystem for a persistent log of changes (sidechains)
        if (this.settings.debug) console.debug('[SENSEMAKER]', '[AGENT]', '[GENESIS]', allDocs);

        // Return the documents
        resolve(allDocs);
      });
    });
  }

  async _setupRedis () {
    // Redis Client
    this.redis = createClient({
      username: this.settings.redis.username,
      password: this.settings.redis.password,
      socket: {
        host: this.settings.redis.host,
        port: this.settings.redis.port,
        enable_offline_queue: false,
        timeout: 10000, // Increased timeout to 10 seconds
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('[AGENT] Redis connection failed after 10 retries');
            return new Error('Redis connection failed after 10 retries');
          }
          const delay = Math.min(retries * 100, 3000);
          console.debug(`[AGENT] Redis reconnecting in ${delay}ms...`);
          return delay;
        }
      }
    });

    // Connect to Redis with timeout
    const connectWithTimeout = new Promise((resolveRedis, rejectRedis) => {
      const timeout = setTimeout(() => {
        rejectRedis(new Error('Redis connection timeout'));
      }, 15000); // 15 second timeout

      // Attempt Redis connection
      this.redis.connect().then(() => {
        clearTimeout(timeout);
        resolveRedis();
      }).catch((error) => {
        clearTimeout(timeout);
        rejectRedis(error);
      });
    });

    await connectWithTimeout;
    console.debug('[AGENT] Redis connected successfully');

    try {
      // Initialize vector store
      const allDocs = await this.ingestReferences();
      console.debug('[AGENT] References loaded, creating vector store...');

      this.embeddings = await RedisVectorStore.fromDocuments(allDocs, new OllamaEmbeddings(), {
        redisClient: this.redis,
        indexName: this.settings.redis.name || 'sensemaker-embeddings'
      });

      console.debug('[AGENT] Vector store initialized successfully');
      this._state.content.status = this._state.status = 'STARTED';
      this.commit();
      resolve(this);
    } catch (error) {
      console.error('[AGENT] Error initializing vector store:', error);
      throw error;
    }
  }

  start () {
    return new Promise(async (resolve, reject) => {
      this._state.content.status = 'STARTING';
      if (this.settings.fabric) await this.fabric.start(); // TODO: capture node.id

      // Load default prompt.
      if (!this.prompt) this.loadDefaultPrompt();

      // Setup Redis
      if (this.settings.redis) {
        this._setupRedis();
      }

      // Attach event handlers.
      // TODO: use Fabric's Service API to define and start all services.
      /* this.services.mistral.on('debug', (...msg) => {
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
      }); */

      // Start Mistral.
      // this.services.mistral.start();

      // Start OpenAI.
      // this.services.openai.start();

      // Prime the model.
      try {
        // await this.prime();
      } catch (exception) {
        console.warn('[AGENT]', `[${this.settings.name.toUpperCase()}]`, 'Could not prime model:', exception);
      }

      // Assert that Agent is ready.
      this.emit('ready');

      // Resolve with Agent.
      resolve(this);
    });
  }

  stop () {
    return new Promise((resolve, reject) => {
      this.fabric.stop().then(async () => {
        // Stop Redis if connected
        if (this.redis) {
          const redisClose = new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('[AGENT]', 'Timeout closing Redis, forcing close');
            this.redis = null;
            resolve();
          }, 5000);

          this.redis.quit().then(() => {
            clearTimeout(timeout);
            console.debug('[AGENT]', 'Redis connection closed');
            this.redis = null;
            resolve();
          }).catch((error) => {
            clearTimeout(timeout);
            if (error.message !== 'The client is closed') {
              console.warn('[AGENT]', 'Error closing Redis:', error);
            }
            this.redis = null;
            resolve();
          });
        });

        await redisClose;
      }

        this.emit('stopped');

        resolve(this);
      }).catch(reject);
    });
  }
}

module.exports = Agent;
