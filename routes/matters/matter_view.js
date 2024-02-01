'use strict';

// // Constansts
// const {
//   PER_PAGE_LIMIT
// } = require('../../constants');

// Components
const MatterView = require('../../components/MatterView');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      // TODO: pagination
      
      const matter = await this.db('matters').select('*').where('id', req.params.id).first();
      console.log("el creador", matter.creator);
      console.log("el del token", req.user.id);
      if (matter.creator == req.user.id) {
        res.send(matter);
      } else {
        res.status(401);
        return res.send({
          type: 'FetchMatchError',
          content: 'Invalid Matter'
        });
      }
    },
    html: () => {
      // TODO: import auth token, load data
      const page = new MatterView({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
