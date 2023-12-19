'use strict';

const Service = require('@fabric/core/types/service');

class CourtListener extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'CourtListener'
    }, settings);

    this.db = knex({
      client: 'postgresql',
      connection: {
        host: this.settings.host,
        port: this.settings.port,
        username: this.settings.username,
        password: this.settings.password,
        database: this.settings.database,
        connectionTimeoutMillis: 5000
      }
    });
  }

  async start () {
    const docketCount = await this.db('dockets').count();

    this.emit('debug', {
      type: 'CourtListenerDocketCount',
      content: docketCount
    });

    return this;
  }
}

module.exports = CourtListener;
