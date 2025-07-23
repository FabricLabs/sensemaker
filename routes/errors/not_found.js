'use strict';

module.exports = function (req, res, next) {
  res.status(404);
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: () => {
      res.json({
        status: 'error',
        message: 'Not Found',
        path: req.path
      });
    },
    default: () => {
      res.send('Not Found');
    }
  });
}; 