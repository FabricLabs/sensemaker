'use strict';

const { Configuration, OpenAIApi } = require('openai');
const Service = require('@fabric/core/types/service');

class OpenAI extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      key: null,
      model: 'text-davinci-003',
      prompt: 'You are JeevesGPT, an artificial intelligence created first to serve human requests accurately and precisely, and second to coordinate with other AIs to perform complex tasks in pursuit of your first goal.  Provide a greeting to a human user who may have prior conversations with you, and ensure that you are able to recall these conversations in the future.',
      state: {}
    }, settings);

    const configuration = new Configuration({
      apiKey: settings.key
    });

    this.openai = new OpenAIApi(configuration);

    this._state = {
      content: this.settings.state
    }

    return this;
  }

  async generateEmbedding (text = '', model = 'text-embedding-ada-002') {
    const result = await this.openai.createEmbedding({
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
      const completion = await this.openai.createChatCompletion({
        max_tokens: 1000,
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

  async _handleRequest (request) {
    const completion = await this.openai.createCompletion({
      max_tokens: 1000,
      model: this.settings.model,
      prompt: request.prompt
    });

    return {
      completion: completion.data
    };
  }
}

module.exports = OpenAI;
