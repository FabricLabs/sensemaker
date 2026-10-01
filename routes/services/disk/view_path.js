'use strict';

const fs = require('fs');
const {
  resolveContainedDiskPath,
  assertRealpathContained
} = require('../../../functions/diskPath');

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      if (!(await this._assertSensemakerAdminJson(req, res))) return;

      const name = req.params.path;
      if (!name) {
        return res.status(400).send({
          message: 'No path provided'
        });
      }

      const resolved = resolveContainedDiskPath(name);
      if (!resolved.ok) {
        return res.status(400).send({
          message: 'Invalid path'
        });
      }

      let isDirectory = false;
      let isFile = false;
      let stats = null;
      let ls = null;
      let content = null;

      try {
        stats = fs.lstatSync(resolved.abs);
        let targetAbs = resolved.abs;
        if (stats.isSymbolicLink()) {
          const real = assertRealpathContained(resolved.abs, resolved.root);
          if (!real.ok) {
            return res.status(404).send({
              message: 'Path not found'
            });
          }
          targetAbs = real.realAbs;
          stats = fs.lstatSync(targetAbs);
          if (stats.isSymbolicLink()) {
            return res.status(404).send({
              message: 'Path not found'
            });
          }
        }

        isDirectory = stats.isDirectory();
        isFile = stats.isFile();

        if (isDirectory) {
          ls = fs.readdirSync(targetAbs).map((file) => {
            const childName = `${name}/${file}`;
            const child = resolveContainedDiskPath(childName);
            const info = child.ok ? fs.lstatSync(child.abs) : null;
            return {
              name: file,
              path: childName,
              stats: info
            };
          });
        }

        if (isFile) {
          content = fs.readFileSync(targetAbs, 'utf8');
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
    html: () => {
      res.send(this.applicationString);
    }
  });
};
