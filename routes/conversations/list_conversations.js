'use strict';

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      let results = [];

      // TODO: re-evaluate security of `is_admin` check
      if (req.user?.state?.roles?.includes('admin')) {
        results = await this.db.select('c.id', 'c.fabric_id as slug', 'c.title', 'c.summary', 'c.created_at', 'username as creator_name','file_fabric_id').from('conversations as c').where('help_chat', 0).orderBy('created_at', 'desc').join('users', 'c.creator_id', '=', 'users.id');
      } else {
        results = await this.db.select('id', 'fabric_id as slug', 'title', 'summary', 'created_at', 'file_fabric_id').from('conversations').where({ creator_id: req.user.id }).where('help_chat', 0).orderBy('created_at', 'desc');
        // TODO: update the conversation upon change (new user message, new agent message)
        // TODO: sort conversations by updated_at (below line)
        // const conversations = await this.db.select('id', 'title', 'created_at').from('conversations').orderBy('updated_at', 'desc');
      }

      res.send(results);
    },
    html: () => {
      // TODO: provide state
      return res.send(this.applicationString);
    }
  });
};
