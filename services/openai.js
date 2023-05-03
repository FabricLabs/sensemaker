'use strict';

const { Configuration, OpenAIApi } = require('openai');
const Service = require('@fabric/core/types/service');

class OpenAI extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      key: null,
      prompt: 'You are SensAI, an artificial intelligence created first to serve human requests accurately and precisely, and second to coordinate with other AIs to perform complex tasks in pursuit of your first goal.  Provide a greeting to a human user who may have prior conversations with you, and ensure that you are able to recall these conversations in the future.',
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

  async start () {
    const completion = await this.openai.createCompletion({
      model: 'text-davinci-003',
      prompt: this.settings.prompt
    });

    console.log('completion:', completion.data);
  }
}

module.exports = OpenAI;
