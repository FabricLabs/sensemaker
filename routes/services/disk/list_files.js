'use strict';

const fs = require('fs');

module.exports = async function (req, res, next) {
  res.format({
    json: () => {
      const path = process.env.PWD;
      const stats = fs.statSync(path);
      const ls = fs.readdirSync(path).map((file) => {
        const stats = fs.statSync(`${path + '/' + file}`);
        return {
          name: file,
          path: file,
          stats
        };
      });

      res.send({
        path,
        stats,
        list: ls
      });
    },
    html: () => {
      res.send(this.applicationString);
    }
  });
};
