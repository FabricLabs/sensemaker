'use strict';

const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const jobs = await this.fabric._GET('/jobs');
  console.debug('got fabric jobs:', jobs);

  res.format({
    json: () => {
      res.json({
        status: 'READY',
        jobs: {}
      });
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
