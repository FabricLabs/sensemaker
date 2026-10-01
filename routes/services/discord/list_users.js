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
        const users = client.users.cache.map((u) => ({
          id: u.id,
          username: u.username,
          discriminator: u.discriminator,
          tag: u.tag,
          bot: u.bot
        }));
        res.json({ users });
      } catch (error) {
        console.error('Could not list users:', error);
        res.status(500).json({ error: error.message || String(error) });
      }
    }
  });
};
