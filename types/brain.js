'use strict';

const { initializeAgentExecutorWithOptions } = require('langchain/agents');
const { OpenAI } = require('langchain/llms/openai');
const { SerpAPI } = require('langchain/tools');
const { Calculator } = require('langchain/tools/calculator');

class Brain {
  constructor (settings = {}) {
    this.model = new OpenAI({ temperature: 0 });
  }

  async start () {
    const model = new OpenAI({ temperature: 0 });
    const tools = [
      new SerpAPI(process.env.SERPAPI_API_KEY, {
        location: "Austin,Texas,United States",
        hl: "en",
        gl: "us",
      }),
      new Calculator()
    ];

    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: "zero-shot-react-description",
      verbose: true,
    });

    const input = "What was the high temperature in SF yesterday in Fahrenheit? What is that number raised to the .023 power?";

    const result = await executor.call({
      input,
    });
  }
}

module.exports = Brain;
