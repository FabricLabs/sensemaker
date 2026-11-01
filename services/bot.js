'use strict';

const Service = require('@fabric/core/types/service');

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
    const text = String(message || '').trim();
    if (!text) return;
    setTimeout(() => {
      const sensemaker = this.sensemaker;
      if (sensemaker && typeof sensemaker._publishShoutbox === 'function') {
        Promise.resolve(sensemaker._publishShoutbox(text)).catch((err) => {
          this.emit('error', err);
        });
        return;
      }
      // Core Service turns `@type: ChatMessage` into a UTF-8 P2P_CHAT_MESSAGE.
      // Do not emit a JSON chat envelope on ChatMessage (0x67).
      this.emit('message', {
        '@type': 'ChatMessage',
        text
      });
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