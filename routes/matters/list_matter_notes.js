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
      const notes = await this.db('matters_notes').where('matter_id', req.params.id).orderBy('created_at', 'desc').paginate({
        perPage: PER_PAGE_LIMIT,
        currentPage: 1
      });

      res.send(notes.data);
    },
    html: () => {
      // TODO: import auth token, load data
      const page = new MattersHome({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
