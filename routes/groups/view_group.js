'use strict';

module.exports = async function (req, res, next) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const group = await this.db('groups').select('id', 'name', 'description').where('id', req.params.id).first();
      if (!group) return res.status(404).send({ error: 'Group not found.' });
      const members = await this.db('group_members').select('fabric_id as id', 'username').where('group_id', group.id).join('users', 'group_members.user_id', 'users.id');
      group.members = members;
      res.json(group);
    }
  });
};
