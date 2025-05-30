'use strict';

module.exports = async function (req, res, next) {
  res.format({
    json: async () => {
      try {
        const file = await this.db('files').select([
          'fabric_id as id',
          'name',
          'blob_id'
        ]).where({ fabric_id: req.params.id }).first();
        res.send(file);
      } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
      }
    },
    html: async () => {
      return res.send(this.applicationString);
    }
  });
}
