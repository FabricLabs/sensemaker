'use strict';

const fs = require('fs');

module.exports = async function (req, res, next) {
  res.format({
    json: () => {
      const root = process.env.PWD;
      const stats = fs.statSync(root);
      const ls = fs.readdirSync(root).map((file) => {
        const stats = fs.statSync(`${root + '/' + file}`);
        return {
          name: file,
          path: file,
          stats
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
