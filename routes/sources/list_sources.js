'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const sources = await this.db('sources').select('id', 'name', 'description', 'content', 'owner', 'status', 'recurrence', 'last_retrieved', 'latest_blob_id').orderBy('updated_at', 'desc');
      // Grant Permissions
      const granted = sources.map((x) => {
        if (x.owner == req.user.fabric_id) x.can_edit = true;
        return x;
      });

      res.json(granted);
    }
  });
};
