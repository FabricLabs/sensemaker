'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      const file = await this.db('files').select('*').where({ name: req.params.filename }).where({creator: req.user.id}).first();
      if(file){
        res.send(file);
      }else{
        res.send({});
      }
    },
  });
}
