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
        const guilds = client.guilds.cache.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          description: g.description,
          memberCount: g.memberCount,
          approximateMemberCount: g.approximateMemberCount
        }));
        res.json({ guilds });
      } catch (error) {
        console.error('Could not list guilds:', error);
        res.status(500).json({ error: error.message || String(error) });
      }
    }
  });
};
