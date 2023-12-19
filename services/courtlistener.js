'use strict';

class CourtListener extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      name: 'CourtListener'
    }, settings);

    this.courtlistener = knex({
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
}

module.exports = CourtListener;
