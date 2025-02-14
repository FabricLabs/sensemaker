'use strict';

module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      try {
        const guild = await this.discord.client.guilds.fetch(req.params.guildid);
        console.debug('got guild:', guild);
        res.send({
          guild: guild
        });
      } catch (error) {
        console.error('Could not fetch guild:', error);
        res.status(500).send({ error });
      }
    }
  });
};
