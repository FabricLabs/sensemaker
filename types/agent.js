'use strict';

const {
  AGENT_TEMPERATURE,
  CHATGPT_MAX_TOKENS
} = require('../constants');

// Dependencies
const fs = require('fs');

// Fabric Types
const Peer = require('@fabric/core/types/peer');
const Service = require('@fabric/core/types/service');

// Sensemaker Services
const OpenAIService = require('../services/openai');

/**
 * The Agent service is responsible for managing an AI agent.  AI agents are self-contained actors which emit messages to a subscriber, which may be a human or another AI agent.
 * @type {Agent} An Agent is a type of Service.
 */
class Agent extends OpenAIService {
  constructor (settings = {}) {
    super(settings);

    // Settings
    this.settings = Object.assign({
      name: 'agent',
      type: 'OpenAI',
      description: 'A service for managing agents.',
      database: {
        type: 'memory'
      },
      parameters: {
        temperature: AGENT_TEMPERATURE,
        max_tokens: CHATGPT_MAX_TOKENS,
        // top_p: 1,
        // frequency_penalty: 0,
        // presence_penalty: 0.6,
        // stop: ['\n'] // TODO: eliminate need for stop tokens
      },
      prompt: prompt,
      timeout: {
        tolerance: 0.5 * 1000 // tolerance in seconds
      }
    }, settings);

    // Database Access
    this.dbprompt = fs.readFileSync('../prompts/database-read.txt');

    // Fabric Agent
    this.fabric = new Peer({
      name: 'fabric',
      description: 'The Fabric agent, which manages a Fabric node for the AI agent.  Fabric is peer-to-peer network for running applications which store and exchange information paid in Bitcoin.',
      type: 'Peer',
      documentation: {
        name: 'Agent',
        description: 'An Agent is a type of Service.',
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
              description: 'A Promise which resolves to the agent\'s response.'
            }
          }
        }
      }
    });

    return this;
  }
  
  start () {
    return new Promise((resolve, reject) => {
      super.start().then(() => {
        this.fabric.start().then(() => {
          resolve(this);
        }).catch(reject);
      }).catch(reject);
    });
  }

  stop () {
    return new Promise((resolve, reject) => {
      super.stop().then(() => {
        this.fabric.stop().then(() => {
          resolve(this);
        }).catch(reject);
      }).catch(reject);
    });
  }
}

module.exports = Agent;
