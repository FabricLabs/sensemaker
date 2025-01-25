'use strict';

module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      try {
        const guilds = await this.discord.client.guilds.fetch();
        res.send(guilds);
      } catch (error) {
        console.error('Could not list guilds:', error);
        res.status(500).send({ error });
      }
    }
  });
};
