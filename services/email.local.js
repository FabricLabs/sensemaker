'use strict';

// Dependencies
const fetch = require('cross-fetch');
const nodemailer = require('nodemailer');
const Service = require('@fabric/core/types/service');

/**
 * Outbound email: Postmark HTTP API or SMTP (e.g. Mailpit at 127.0.0.1:1025).
 */
class EmailService extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'EmailService',
      /** `postmark` | `smtp` — default: smtp if host set, else postmark if key set */
      transport: null,
      host: null,
      port: 587,
      secure: false,
      requireTLS: false,
      ignoreTLS: false,
      auth: null,
      /** Postmark server token when transport is postmark */
      key: null,
      state: {
        status: 'INITIALIZED'
      }
    }, settings);

    this._smtpTransport = null;
    return this;
  }

  _resolveTransport () {
    const t = this.settings.transport;
    if (t === 'postmark') return 'postmark';
    if (t === 'smtp') return 'smtp';
    if (this.settings.host) return 'smtp';
    if (this.settings.key) return 'postmark';
    return null;
  }

  _getSmtpTransport () {
    if (this._smtpTransport) return this._smtpTransport;
    const { host, port, secure, auth, requireTLS, ignoreTLS } = this.settings;
    if (!host) {
      throw new Error('EmailService: SMTP host is not configured');
    }
    this._smtpTransport = nodemailer.createTransport({
      host,
      port: port || 1025,
      secure: !!secure,
      requireTLS: !!requireTLS,
      ignoreTLS: !!ignoreTLS,
      auth: auth && auth.user ? { user: auth.user, pass: auth.pass || '' } : undefined
    });
    return this._smtpTransport;
  }

  async deliver (message) {
    return this.send(message);
  }

  async send (message) {
    this.emit('debug', `[${this.settings.name}] Sending message...`, { to: message.to, subject: message.subject });

    const mode = this._resolveTransport();
    if (!mode) {
      const err = new Error('EmailService: no transport (set host for SMTP or key for Postmark)');
      this.emit('error', err.message);
      throw err;
    }

    if (mode === 'postmark') {
      if (!this.settings.key) {
        const err = new Error('EmailService: Postmark key missing');
        this.emit('error', err.message);
        throw err;
      }
      try {
        const result = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            'X-Postmark-Server-Token': `${this.settings.key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            From: message.from,
            To: message.to,
            Subject: message.subject,
            HtmlBody: message.html,
            TextBody: message.text,
            MessageStream: 'outbound'
          })
        });
        const body = await result.text();
        this.emit('debug', `Email sent (Postmark):`, body);
        if (!result.ok) {
          throw new Error(`Postmark error ${result.status}: ${body}`);
        }
      } catch (exception) {
        this.emit('error', `[${this.settings.name}] Postmark send failed: ${exception.message}`);
        throw exception;
      }
      return this;
    }

    try {
      const transporter = this._getSmtpTransport();
      const info = await transporter.sendMail({
        from: message.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html
      });
      this.emit('debug', `[${this.settings.name}] SMTP sent:`, info && info.messageId);
    } catch (exception) {
      this.emit('error', `[${this.settings.name}] SMTP send failed: ${exception.message}`);
      throw exception;
    }

    return this;
  }

  async start () {
    this.emit('debug', `[${this.settings.name}] Starting...`);
    return this;
  }

  async stop () {
    this.emit('debug', `[${this.settings.name}] Stopping...`);
    if (this._smtpTransport && typeof this._smtpTransport.close === 'function') {
      this._smtpTransport.close();
      this._smtpTransport = null;
    }
    return this;
  }
}

module.exports = EmailService;
