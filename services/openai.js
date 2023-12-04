'use strict';

const {
  CHATGPT_MAX_TOKENS
} = require('../constants');

const { Configuration, OpenAIApi, OpenAI } = require('openai');
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
    const message = { id: request.message_id };

    try {
      const stream = await this.openai.beta.chat.completions.stream({
        max_tokens: CHATGPT_MAX_TOKENS,
        messages: request.messages,
        model: this.settings.model,
        stream: true
      });

      stream.on('content', (delta, snapshot) => {
        this.emit('MessageChunk', {
          message_id: request.message_id,
          conversation_id: request.conversation_id,
          content: delta
        });
      });

      stream.on('finalChatCompletion', (completion) => {
        console.debug('FINAL CHAT COMPLETION:', completion);
        message.content = completion.choices[0].message.content;
        this.emit('MessageEnd', message);
      });
    } catch (exception) {
      this.emit('error', `Could not create Conversation: ${exception}`);
      return null;
    }
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
