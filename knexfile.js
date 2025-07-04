'use strict';

const settings = require('./settings/local');

module.exports = {
  development: {
    client: 'mysql2',
    connection: settings.db,
    migrations: {
      directory: './migrations'
    }
  },
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.SQL_DB_HOST || settings.db.host || 'localhost',
      port: process.env.SQL_DB_PORT || settings.db.port || 3306,
      user: process.env.SQL_DB_USER || settings.db.user || 'db_user_sensemaker',
      password: process.env.SQL_DB_CRED || process.env.MYSQL_PASSWORD || settings.db.password,
      database: process.env.SQL_DB_NAME || settings.db.database || 'db_sensemaker'
    },
    migrations: {
      directory: './migrations'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};
