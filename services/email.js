'use strict';

// Dependencies
const nodemailer = require('nodemailer');
const {
  SMTPClient
} = require('smtp-client');

const Service = require('@fabric/core/types/service');

class EmailService extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'EmailService'
    }, settings);

    this.smtp = new SMTPClient({
      host: this.settings.host,
      port: this.settings.port,
      secure: true,
      auth: {
        user: this.settings.username,
        pass: this.settings.password
      }
    });

    return this;
  }

  async deliver (message) {
    this.emit('debug', `[${this.settings.name}] Delivering message...`);

    try {
      await this.smtp.connect();
      await this.smtp.greet({ hostname: this.settings.host }); // hostname of your mail server
      await this.smtp.authPlain({
        username: this.settings.username,
        password: this.settings.password
      });

      await this.smtp.mail({ from: message.from });
      await this.smtp.rcpt({ to: message.to });
      await this.smtp.data(message.text || message.html);
      await this.smtp.quit();
    } catch (error) {
      this.emit('error', `[${this.settings.name}] Error delivering message: ${error.message}`);
    }
  
    return this;
  }

  async send (message) {
    this.emit('debug', `[${this.settings.name}] Sending message...`, message);

    try {
      const transporter = nodemailer.createTransport({
        // service: 'gmail',
        host: this.settings.host,
        port: this.settings.port,
        secure: this.settings.secure,
        auth: {
          user: this.settings.username,
          pass: this.settings.password
        }
      });

      const result = await transporter.sendMail(message);
      this.emit('debug', `[${this.settings.name}] Message sent: ${result.messageId}`);
      this.emit('debug', `[${this.settings.name}] Message sent: ${Object.keys(result)}`, result);
    } catch (error) {
      this.emit('error', `[${this.settings.name}] Error sending message: ${error.message}`);
      throw error; // Rethrow the error
    }

    return this;
  }

  async start () {
    this.emit('debug', `[${this.settings.name}] Starting...`);

    return this;
  }

  async stop () {
    this.emit('debug', `[${this.settings.name}] Stopping...`);

    return this;
  }
}

module.exports = EmailService;
