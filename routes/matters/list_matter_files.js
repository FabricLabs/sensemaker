'use strict';

// Constants
const {
  PER_PAGE_LIMIT
} = require('../../constants');

// Components
const JeevesUI = require('../../components/JeevesUI');
const CaseHome = require('../../components/CaseHome');
const MattersHome = require('../../components/MattersHome');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      console.log("el id",req.params.id);
      const files = await this.db('matters_files').where('matter_id', req.params.id).orderBy('created_at', 'desc').paginate({
        perPage: PER_PAGE_LIMIT,
        currentPage: 1
      });

      res.send(files.data);
    },
    html: () => {
      // TODO: import auth token, load data
      const page = new CaseHome({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
