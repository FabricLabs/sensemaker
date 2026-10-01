'use strict';

const fs = require('fs');
const { diskRoot, resolveContainedDiskPath } = require('../../../functions/diskPath');

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      if (!(await this._assertSensemakerAdminJson(req, res))) return;

      const resolved = resolveContainedDiskPath('');
      if (!resolved.ok) {
        return res.status(400).send({ message: 'Invalid path' });
      }

      const root = diskRoot();
      const stats = fs.lstatSync(root);
      const ls = fs.readdirSync(root).map((file) => {
        const child = resolveContainedDiskPath(file);
        const childStats = child.ok ? fs.lstatSync(child.abs) : null;
        return {
          name: file,
          path: file,
          stats: childStats
        };
      });

      res.send({
        path: '/',
        object: {
          path: root,
          stats,
          list: ls
        }
      });
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
