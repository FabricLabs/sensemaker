'use strict';

const fs = require('fs');

module.exports = async function (req, res, next) {
  res.format({
    'json': () => {
      // TODO: secure this endpoint
      const base = process.env.PWD;
      const name = req.params.path;
      const path = base + '/' + name;

      console.debug('name:', name);
      console.debug('path:', path);

      if (!name) {
        return res.status(400).send({
          message: 'No path provided'
        });
      }

      let isDirectory = false;
      let isFile = false;
      let stats = null;

      try {
        isDirectory = fs.lstatSync(path).isDirectory();
        isFile = fs.lstatSync(path).isFile();
        stats = fs.statSync(path);
      } catch (error) {
        console.error('[FILE]', 'Error:', error);
      }

      if (!stats) {
        return res.status(404).send({
          message: 'Path not found'
        });
      }

      res.send({
        isDirectory,
        isFile,
        name: name,
        path: name,
        stats
      });
    },
    'html': () => {
      res.send(this.applicationString);
    }
  });
};
