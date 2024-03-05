'use strict';

// Dependencies
const merge = require('lodash.merge');

// Fabric Types
const Service = require('@fabric/core/types/service');

// Types
const Agent = require('./agent');

class Coordinator extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = merge({
      actions: ['sleep'],
      agent: {
        host: 'localhost:11434',
        prompt: 'You are CoordinatorAI, designed to coordinate actions and goals for a system.'
      },
      goals: [{ status: 'SLEEPING' }],
      rules: [
        'Do not provide any response other than the exact name of an action.'
      ]
    }, settings);

    this.agent = new Agent(this.settings.agent);
    this.chooser = null;

    return this;
  }

  get actions () {
    return this.actions;
  }

  async chooseAction (state) {
    let choice = null;

    try {
      const response = await this.chooser.query({
        state: this.state,
        query: 'What action to take?'
      });

      choice = response.content;
    } catch (exception) {
      console.error('[COORDINATOR]', 'Error choosing action:', exception);
    }

    return choice;
  }

  async query (request) {
    const choice = this.chooseAction(request);

    try {
      const response = await this.agent.query({
        state: this.state,
        query: 'What action to take?'
      });

      choice = response.content;
    } catch (exception) {
      console.error('[COORDINATOR]', 'Error choosing action:', exception);
    }

    return {
      choice: choice
    };
  }

  async start () {
    this.chooser = new Agent(merge(this.settings.agent, {
      prompt: `You are ChooserAI, designed to pick the best action for a provided state.\n\nActions you can take:\n\n- ${this.settings.actions.join('\n  -')}\n\nGoals you can achieve:\n\n- ${this.settings.goals.map(JSON.stringify).join('\n  -')}\n\n`
    }));

    await this.agent.start();
    await this.chooser.start();

    return this;
  }

  async stop () {
    await this.agent.stop();
    await this.chooser.stop();
    return this;
  }
}

module.exports = Coordinator;
