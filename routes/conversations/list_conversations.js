'use strict';

const Actor = require('@fabric/core/types/actor');

module.exports = function (req, res, next) {
  res.format({
    json: async () => {
      let results = [];

      // TODO: re-evaluate security of `is_admin` check
      if (req.user?.state?.roles?.includes('admin')) {
        results = await this.db.select('c.fabric_id as id', 'c.id as dbid', 'c.fabric_id as slug', 'c.fabric_id', 'c.title', 'c.summary', 'c.created_at', 'username as creator_name').from('conversations as c').where('help_chat', 0).orderBy('created_at', 'desc').join('users', 'c.creator_id', '=', 'users.id');
      } else {
        results = await this.db.select('fabric_id as id', 'id as dbid', 'fabric_id as slug', 'c.fabric_id', 'title', 'summary', 'created_at').from('conversations').where({ creator_id: req.user.id }).where('help_chat', 0).orderBy('created_at', 'desc');
        // TODO: update the conversation upon change (new user message, new agent message)
        // TODO: sort conversations by updated_at (below line)
        // const conversations = await this.db.select('id', 'title', 'created_at').from('conversations').orderBy('updated_at', 'desc');
      }

      for (let i = 0; i < results.length; i++) {
        const conversation = results[i];
        if (!conversation.fabric_id) {
          // TODO: ensure no LocalConversation is shared externally
          const actor = new Actor({ type: 'LocalConversation', name: `sensemaker/conversations/${conversation.dbid}`, created: conversation.created_at });
          await this.db('conversations').update({ fabric_id: actor.id }).where({ id: conversation.id });
        }
      }

      res.send(results);
    },
    html: () => {
      // TODO: provide state
      return res.send(this.applicationString);
    }
  });
};
