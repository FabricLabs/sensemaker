'use strict';

// Constansts
const {
  PER_PAGE_LIMIT
} = require('../../constants');

// Components
const MattersNew = require('../../components/MattersNew');

module.exports = function (req, res, next) {
   res.format({
    html: () => {
      res.send(this.applicationString);
    }
  });
};
