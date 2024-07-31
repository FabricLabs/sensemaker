'use strict'

const fetch = require('cross-fetch');

const Service = require('@fabric/core/types/service');

class LinkedIn extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      id: '',
      secret: '',
      token: ''
    }, settings);

    this._token = null;

    return this;
  }

  async getToken () {
    return new Promise((resolve, reject) => {
      fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: Object.entries({
          grant_type: 'client_credentials',
          client_id: this.settings.id,
          client_secret: this.settings.secret
        }).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
      }).then((response) => {
        return response.json();
      }).then((data) => {
        console.debug('[LINKEDIN]', 'got linkedin token:', data);
        this.token = data.access_token;
        resolve(this.token);
      }).catch((error) => {
        console.error('[LINKEDIN]', 'error getting linkedin token:', error);
      });
    });
  }

  async getConnections () {
    return new Promise((resolve, reject) => {
      fetch('https://api.linkedin.com/v2/connections', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }).then((response) => {
        return response.json();
      }).then((data) => {
        console.debug('[LINKEDIN]', 'got linkedin connections:', data);
        resolve(data);
      }).catch((error) => {
        console.error('[LINKEDIN]', 'error getting linkedin connections:', error);
        reject(error);
      });
    });
  }

  async start () {
    console.debug('[LINKEDIN]', 'starting linkedin service...');
    await this.getToken();
    await this.getConnections();
  }
}

module.exports = LinkedIn;
