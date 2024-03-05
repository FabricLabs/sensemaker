'use strict';

const {
  CHATGPT_MAX_TOKENS
} = require('../constants');

const fetch = require('cross-fetch');
const { Configuration, OpenAIApi, OpenAI } = require('openai');
const Actor = require('@fabric/core/types/actor');
const Service = require('@fabric/core/types/service');

class OpenAIService extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      key: null,
      model: 'text-davinci-003',
      prompt: 'You are JeevesGPT, an artificial intelligence created first to serve human requests accurately and precisely, and second to coordinate with other AIs to perform complex tasks in pursuit of your first goal.  Provide a greeting to a human user who may have prior conversations with you, and ensure that you are able to recall these conversations in the future.',
      state: {}
    }, settings);

    /* const configuration = new Configuration({
      apiKey: settings.key
    });

    this.openai = new OpenAIApi(configuration); */

    this.openai = new OpenAI({
      apiKey: settings.key
    });

    this._state = {
      content: this.settings.state
    }

    return this;
  }

  async generateEmbedding (text = '', model = 'text-embedding-ada-002') {
    const result = await this.openai.embeddings.create({
      input: text,
      model: model
    });

    return result.data;
  }

  async start () {
    this._state.content.status = 'STARTING';
    this._state.content.status = 'STARTED';
    this.commit();
    return this;
  }

  async stop () {
    this._state.content.status = 'STOPPING';
    this._state.content.status = 'STOPPED';
    this.commit();
    return this;
  }

  async _handleConversationRequest (request) {
    try {
      const completion = await this.openai.chat.completions.create({
        max_tokens: CHATGPT_MAX_TOKENS,
        messages: request.messages,
        model: this.settings.model
      });

      return {
        completion: completion.data
      };
    } catch (exception) {
      this.emit('error', `Could not create Conversation: ${exception}`);
      return null;
    }
  }

  async _streamConversationRequest (request) {
    if (this.settings.debug) console.debug('[AGENT]', '[RAG]', 'Streaming Conversation Request:', request.query, Object.keys(request));
    console.debug('[AGENT]', '[RAG]', 'Streaming Conversation Request:', Object.keys(request));
    return new Promise(async (resolve, reject) => {
      const entropy = request.entropy || 0.0;
      const seed = new Actor({ name: `entropies/${entropy + ''}` });
      const message = (request.message_id) ? { id: request.message_id } : { id: seed.id };

      try {
        const stream = this.openai.beta.chat.completions.stream({
          max_tokens: CHATGPT_MAX_TOKENS,
          messages: request.messages,
          model: this.settings.model,
          stream: true,
          tool_choice: request.tool_choice,
          tools: request.tools
        });

        this.emit('MessageStart', {
          message_id: request.message_id,
          conversation_id: request.conversation_id
        });

        stream.on('content', (delta, snapshot) => {
          this.emit('MessageChunk', {
            message_id: request.message_id,
            conversation_id: request.conversation_id,
            content: delta
          });
        });

        stream.on('finalChatCompletion', (completion) => {
          if (this.settings.debug) console.debug('[AGENT]', '[OPENAI]', 'FINAL CHAT COMPLETION:', completion);
          const choice = completion.choices[0];
          if (!choice) reject(new Error('No choices given.'));

          switch (choice.finish_reason) {
            default:
              console.warn('Unhandled finish reason:', choice.finish_reason);
              break;
            case 'stop':
              // Attach message content
              if (message) message.content = completion.choices[0].message.content;
              break;
            case 'tool_calls':
              // console.debug('[AGENT]', '[RAG]', 'Message:', choice.message);
              // console.debug('[AGENT]', '[RAG]', 'Tool calls:', choice.message.tool_calls);
              for (let i = 0; i < choice.message.tool_calls.length; i++) {
                const toolcall = choice.message.tool_calls[i];
                switch (toolcall.type) {
                  case 'function':
                    console.debug('[AGENT]', '[RAG]', 'Tool call:', toolcall);
                    switch (toolcall.function.name) {
                      case 'search_host':
                        console.debug('[AGENT]', '[RAG]', '[SEARCH]', toolcall);
                        const messages = request.messages; // TODO: pull higher in logic?

                        // Add agent response to conversation
                        messages.push(choice.message);

                        try {
                          const args = JSON.parse(toolcall.function.arguments);
                          console.debug('[AGENT]', '[RAG]', '[SEARCH]', 'Arguments:', args);
                          const whitelist = [
                            '127.0.0.1:3045',
                            'trynovo.com',
                            'jeeves.dev',
                            'beta.jeeves.dev'
                            /*, 'alpha.jeeves.dev' */
                          ];

                          const resourcePaths = [
                            '/cases',
                            '/documents',
                            '/people',
                            '/courts',
                            '/judges',
                            '/opinions',
                            '/jurisdictions',
                            '/reporters',
                            '/statutes',
                            '/volumes'
                          ];

                          if (!whitelist.includes(args.host?.toLowerCase())) {
                            console.warn('[AGENT]', '[RAG]', '[SEARCH]', 'Host not in whitelist:', args.host);
                          } else if (!resourcePaths.includes(args.path?.toLowerCase())) {
                            console.warn('[AGENT]', '[RAG]', '[SEARCH]', 'Path not in whitelist:', args.path);
                          } else {
                            // Execute Network Request
                            fetch(`http://${args.host}${args.path}`, { // TODO: switch to HTTPS first/only
                              method: 'SEARCH', // only enable SEARCH
                              headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify(args)
                            }).then(async (response) => {
                              if (this.settings.debug) console.debug('[AGENT]', '[RAG]', '[SEARCH]', 'Response:', response);
                              // const obj = await response.json();
                              // console.debug('[AGENT]', '[RAG]', '[SEARCH]', 'Object:', obj);

                              const record = {
                                tool_call_id: toolcall.id,
                                role: 'tool',
                                name: toolcall.function.name,
                                content: await response.text()
                              };

                              messages.push(record);

                              // Recurse with new messages
                              return this._streamConversationRequest({
                                query: request.query,
                                messages: messages
                              }).then(resolve).catch(reject);
                            }).catch((exception) => {
                              console.error('[AGENT]', '[RAG]', '[SEARCH]', 'Exception in tool execution:', exception);
                            });
                          }
                        } catch (exception) {
                          console.error('[AGENT]', '[RAG]', '[SEARCH]', 'Exception:', exception);
                        }
                        break;
                      default:
                        console.debug('[AGENT]', '[RAG]', 'Unhandled tool call:', toolcall);
                        break;
                    }
                    break;
                  default:
                    console.warn('[AGENT]', '[RAG]', 'Unhandled tool call type:', toolcall.type);
                    break;
                }
              }
              break;
          }

          // Notify the message is complete
          this.emit('MessageEnd', message);
          resolve(message);
        });
      } catch (exception) {
        this.emit('error', `Could not create Conversation: ${exception}`);
        reject(exception);
      }
    });
  }

  async _handleRequest (request) {
    const completion = await this.openai.createCompletion({
      max_tokens: CHATGPT_MAX_TOKENS,
      model: this.settings.model,
      prompt: request.prompt
    });

    return {
      completion: completion.data
    };
  }
}

module.exports = OpenAIService;
