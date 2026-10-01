'use strict';

const { discordClientOr503 } = require('./_discordClient');

module.exports = async function (req, res) {
  res.format({
    html: () => {
      res.send(this.applicationString);
    },
    json: async () => {
      const client = discordClientOr503(this, res);
      if (!client) return;
      try {
        const u = await client.users.fetch(req.params.id);
        res.json({
          user: {
            id: u.id,
            username: u.username,
            discriminator: u.discriminator,
            tag: u.tag,
            bot: u.bot,
            avatar: u.avatar
          }
        });
      } catch (error) {
        console.error('Could not fetch user:', error);
        res.status(500).json({ error: error.message || String(error) });
      }
    }
  });
};
