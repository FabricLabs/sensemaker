'use strict';

const Service = require('@fabric/core/types/service');
const Message = require('@fabric/core/types/message');

const Sensemaker = require('../services/sensemaker');

class Bot extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'Bot',
      delay: 1000,
      responses: [
        'Hello! I am a bot.',
        'How can I help you today?',
        'Interesting message!',
        'I\'m here to assist.',
        'Tell me more about that.'
      ]
    }, settings);

    this.sensemaker = this.settings.sensemaker || new Sensemaker(this.settings);

    return this;
  }

  _send (message) {
    setTimeout(() => {
      const response = {
        type: 'P2P_CHAT_MESSAGE',
        actor: {
          id: this.id
        },
        object: {
          created: Date.now(),
          content: message
        },
        target: '/messages'
      };

      const msg = Message.fromVector(['ChatMessage', JSON.stringify(response)]);
      this.emit('message', msg);
    }, this.settings.delay);
  }

  _getRandomResponse () {
    const index = Math.floor(Math.random() * this.settings.responses.length);
    return this.settings.responses[index];
  }

  async start () {
    await this.sensemaker.start();
  }

  async stop () {
    await this.sensemaker.stop();
  }
}

module.exports = Bot; 