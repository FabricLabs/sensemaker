const settings = require('./settings/local');

module.exports = {
  development: {
    client: 'mysql2',
    connection: settings.db,
    migrations: {
      directory: './migrations'
    }
  }
};
