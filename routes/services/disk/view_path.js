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
      let ls = null;
      let content = null;

      try {
        isDirectory = fs.lstatSync(path).isDirectory();
        isFile = fs.lstatSync(path).isFile();
        stats = fs.statSync(path);

        if (isDirectory) {
          ls = fs.readdirSync(path).map((file) => {
            const ours = `${name}/${file}`;
            const info = fs.statSync(base + '/' + ours);
            return {
              name: file,
              path: ours,
              stats: info
            };
          });
        }

        if (isFile) {
          content = fs.readFileSync(path, 'utf8');
        }
      } catch (error) {
        console.error('[FILE]', 'Error:', error);
      }

      if (!stats) {
        return res.status(404).send({
          message: 'Path not found'
        });
      }

      res.send({
        path: name,
        object: {
          isDirectory,
          isFile,
          list: ls,
          name,
          stats,
          content
        }
      });
    },
    'html': () => {
      res.send(this.applicationString);
    }
  });
};
