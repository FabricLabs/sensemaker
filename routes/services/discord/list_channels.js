'use strict';

module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      try {
        const channels = await this.discord.client.channels.fetch();
        res.send(channels);
      } catch (error) {
        console.error('Could not list channels:', error);
        res.status(500).send({ error });
      }
    }
  });
};
