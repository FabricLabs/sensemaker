'use strict';

// // Constansts
// const {
//   PER_PAGE_LIMIT
// } = require('../../constants');

// Components
const MatterNewChat = require('../../components/MatterNewChat');

module.exports = function (req, res, next) {
  res.format({
    // json: async () => {
    //   // TODO: pagination
    //   const matter = await this.db('matters').select('*').where('id', req.params.id).first();
    //   if (matter.creator == req.user.id) {
    //     res.send(matter);
    //   } else {
    //     res.status(401);
    //     return res.send({
    //       type: 'FetchMatchError',
    //       content: 'Invalid Matter'
    //     });
    //   }
    // },
    html: () => {
      // TODO: import auth token, load data
      const page = new MatterNewChat({});
      const output = page.toHTML();
      return res.send(this.http.app._renderWith(output));
    }
  });
};
