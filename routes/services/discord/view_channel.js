'use strict';

module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      try {
        const channel = await this.discord.client.channels.fetch(req.params.id);
        console.debug('got channel:', channel);
        res.send({
          channel: channel
        });
      } catch (error) {
        console.error('Could not fetch channel:', error);
        res.status(500).send({ error });
      }
    }
  });
};
