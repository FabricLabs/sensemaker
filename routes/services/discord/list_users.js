'use strict';

module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      try {
        const users = await this.discord.client.users.fetch();
        res.send(users);
      } catch (error) {
        console.error('Could not list users:', error);
        res.status(500).send({ error });
      }
    }
  });
};
