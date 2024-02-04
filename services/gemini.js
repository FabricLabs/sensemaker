'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Agent = require('../types/agent');

class Gemini extends Agent {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'Gemini',
      model: 'gemini-pro',
      // TODO: import from prompts/sensemaker.txt
      prompt: 'You are Sensemaker, an assistant designed to accumulate and interpret data from a wide variety of sources, then present that data in meaningful, interactive ways to the user.  Text is your only interface, and you should avoid revealing any internal design details to the user.  Use Markdown formatting where possible, and keep the answers concise and easy to explain using step-by-step reasoning.',
      token: null,
      version: '0.0.1'
    }, settings);

    this.ai = new GoogleGenerativeAI(this.settings.token);
    this.gemini = this.ai.getGenerativeModel({ model: this.settings.model });

    return this;
  }

  get hello () {
    return `Hello, I am ${this.settings.name}.  How can I help you today?`;
  }

  async query (request) {
    return new Promise(async (resolve, reject) => {
      console.debug('[GEMINI]', 'Querying:', request);

      try {
        const chat = this.gemini.startChat({
          history: [
            { role: 'user', parts: this.prompt },
            { role: 'model', parts: this.hello }
          ],
          /* generationConfig: {
            maxOutputTokens: 100,
          } */
        });

        const result = await chat.sendMessage(request.query);
        const response = await result.response;
        const text = response.text();

        console.debug('[GEMINI]', 'Prompt:', this.prompt);
        console.debug('[GEMINI]', 'Messages:', request.messages);
        console.debug('[GEMINI]', 'Query:', request.query);
        console.debug('[GEMINI]', 'Response:', response);
        console.debug('[GEMINI]', 'Text:', text);

        resolve({
          type: 'AgentResponse',
          name: this.settings.name,
          status: 'success',
          query: request.query,
          response: response,
          content: text
        });
      } catch (exception) {
        console.error('[GEMINI]', 'Exception:', exception);
        reject(exception);
      }
    });
  }
}

module.exports = Gemini;
