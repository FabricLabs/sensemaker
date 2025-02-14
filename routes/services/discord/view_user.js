'use strict';

module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      try {
        const user = await this.discord.client.users.fetch(req.params.id);
        console.debug('got user:', user);
        res.send({
          user: user
        });
      } catch (error) {
        console.error('Could not fetch user:', error);
        res.status(500).send({ error });
      }
    }
  });
};
